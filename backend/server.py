from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import boto3
from botocore.client import Config

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsAllowInvalidCertificates=True)
db = client[os.environ['DB_NAME']]

# Cloudflare R2 Configuration
s3_client = boto3.client(
    's3',
    endpoint_url=os.environ['R2_ENDPOINT'],
    aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
    config=Config(signature_version='s3v4'),
    region_name='auto'
)
R2_BUCKET = os.environ['R2_BUCKET_NAME']
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL', os.environ['R2_ENDPOINT'])

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Enhanced Models for multi-language and business accounts
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    whatsapp: str
    account_type: str = "author"  # "author" or "business"
    store_name: Optional[str] = None  # For business accounts

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    whatsapp: str
    role: str = "user"
    account_type: str = "author"
    store_name: Optional[str] = None
    preferred_language: str = "az"
    created_at: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    whatsapp: Optional[str] = None
    store_name: Optional[str] = None
    preferred_language: Optional[str] = None

class BookMultiLang(BaseModel):
    title: str
    author: str
    description: str

class Book(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title_az: str
    title_en: str
    title_ru: str
    author_az: str
    author_en: str
    author_ru: str
    description_az: str
    description_en: str
    description_ru: str
    category: str
    price: float
    is_paid: bool
    pdf_file: str  # Full PDF
    demo_pdf_file: Optional[str] = None  # Demo PDF (for paid books)
    cover_image: str
    seller_id: str
    seller_name: str
    seller_type: str  # "author" or "business"
    seller_whatsapp: str
    created_at: str
    avg_rating: float = 0.0
    reviews_count: int = 0

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    book_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class PageContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    page: str
    title_az: str
    title_en: str
    title_ru: str
    content_az: str
    content_en: str
    content_ru: str
    updated_at: str

# Helper functions for R2
async def upload_to_r2(file_content: bytes, filename: str, content_type: str) -> str:
    """Upload file to Cloudflare R2 and return public URL"""
    try:
        file_key = f"{uuid.uuid4()}_{filename}"
        s3_client.put_object(
            Bucket=R2_BUCKET,
            Key=file_key,
            Body=file_content,
            ContentType=content_type
        )
        return f"{R2_PUBLIC_URL}/{file_key}"
    except Exception as e:
        logger.error(f"R2 upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fayl yüklənə bilmədi: {str(e)}")

# Universal file upload endpoint for Firebase frontend
@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form(default="uploads")
):
    """Upload any file to R2 storage"""
    try:
        file_content = await file.read()
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
        new_filename = f"{folder}/{uuid.uuid4()}.{file_ext}"
        
        s3_client.put_object(
            Bucket=R2_BUCKET,
            Key=new_filename,
            Body=file_content,
            ContentType=file.content_type
        )
        
        file_url = f"{R2_PUBLIC_URL}/{new_filename}"
        return {"success": True, "url": file_url}
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fayl yüklənə bilmədi: {str(e)}")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token etibarsızdır")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="İstifadəçi tapılmadı")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token vaxtı bitib")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token etibarsızdır")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin icazəsi tələb olunur")
    return current_user

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email artıq qeydiyyatdan keçib")
    
    # Validation for author accounts
    if user_data.account_type == "author":
        if user_data.name != user_data.name:  # This will be validated on frontend with author name
            pass  # Frontend will handle this validation
    
    # Validation for business accounts
    if user_data.account_type == "business":
        if not user_data.store_name:
            raise HTTPException(status_code=400, detail="Mağaza adı tələb olunur")
    
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_pwd,
        "name": user_data.name,
        "whatsapp": user_data.whatsapp,
        "role": "user",
        "account_type": user_data.account_type,
        "store_name": user_data.store_name if user_data.account_type == "business" else None,
        "preferred_language": "az",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user_id})
    
    user = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        whatsapp=user_data.whatsapp,
        role="user",
        account_type=user_data.account_type,
        store_name=user_data.store_name,
        preferred_language="az",
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email və ya şifrə yanlışdır")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_obj = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        whatsapp=user["whatsapp"],
        role=user.get("role", "user"),
        account_type=user.get("account_type", "author"),
        store_name=user.get("store_name"),
        preferred_language=user.get("preferred_language", "az"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user_obj)

# User routes
@api_router.get("/users/profile", response_model=User)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@api_router.put("/users/profile", response_model=User)
async def update_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {}
    if user_update.name is not None:
        update_data["name"] = user_update.name
    if user_update.whatsapp is not None:
        update_data["whatsapp"] = user_update.whatsapp
    if user_update.store_name is not None and current_user.get("account_type") == "business":
        update_data["store_name"] = user_update.store_name
    if user_update.preferred_language is not None:
        update_data["preferred_language"] = user_update.preferred_language
    
    if update_data:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
        current_user.update(update_data)
    
    return User(**current_user)

# Admin - User Management
@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return {"users": users}

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(get_admin_user)):
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Rol yalnız 'user' və ya 'admin' ola bilər")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="İstifadəçi tapılmadı")
    
    return {"message": "Rol yeniləndi"}

# Book routes with multi-language support
@api_router.post("/books")
async def create_book(
    title_az: str = Form(...),
    title_en: str = Form(""),
    title_ru: str = Form(""),
    author_az: str = Form(...),
    author_en: str = Form(""),
    author_ru: str = Form(""),
    description_az: str = Form(""),
    description_en: str = Form(""),
    description_ru: str = Form(""),
    category: str = Form(...),
    price: float = Form(0),
    is_paid: bool = Form(False),
    pdf_file: Optional[UploadFile] = File(None),
    demo_pdf_file: Optional[UploadFile] = File(None),
    cover_image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate author name for author accounts
    if current_user.get("account_type") == "author":
        if author_az != current_user["name"]:
            raise HTTPException(
                status_code=400, 
                detail="Müəllif adı hesab adı ilə eyni olmalıdır"
            )
    
    # Validate: For paid books, only demo PDF is required (full PDF not needed)
    if is_paid and price > 0 and not demo_pdf_file:
        raise HTTPException(status_code=400, detail="Pullu kitab üçün demo PDF tələb olunur")
    
    # Validate: For free books, full PDF is required
    if not is_paid and not pdf_file:
        raise HTTPException(status_code=400, detail="Pulsuz kitab üçün PDF tələb olunur")
    
    # Upload full PDF to R2 (only for free books)
    pdf_url = None
    if pdf_file:
        pdf_content = await pdf_file.read()
        pdf_url = await upload_to_r2(pdf_content, pdf_file.filename, 'application/pdf')
    
    # Upload demo PDF if provided
    demo_pdf_url = None
    if demo_pdf_file:
        demo_pdf_content = await demo_pdf_file.read()
        demo_pdf_url = await upload_to_r2(demo_pdf_content, demo_pdf_file.filename, 'application/pdf')
    
    # Upload cover image to R2
    cover_content = await cover_image.read()
    cover_url = await upload_to_r2(cover_content, cover_image.filename, cover_image.content_type)
    
    book_id = str(uuid.uuid4())
    book_doc = {
        "id": book_id,
        "title_az": title_az,
        "title_en": title_en,
        "title_ru": title_ru,
        "author_az": author_az,
        "author_en": author_en,
        "author_ru": author_ru,
        "description_az": description_az,
        "description_en": description_en,
        "description_ru": description_ru,
        "category": category,
        "price": price,
        "is_paid": is_paid,
        "pdf_file": pdf_url,
        "demo_pdf_file": demo_pdf_url,
        "cover_image": cover_url,
        "seller_id": current_user["id"],
        "seller_name": current_user["name"],
        "seller_type": current_user.get("account_type", "author"),
        "seller_whatsapp": current_user["whatsapp"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "avg_rating": 0.0,
        "reviews_count": 0,
        "views": 0
    }
    
    await db.books.insert_one(book_doc)
    
    return {"message": "Kitab əlavə edildi", "book_id": book_id}

@api_router.get("/books")
async def get_books(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    language: str = "az"
):
    query = {}
    
    if category:
        query["category"] = category
    
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    
    if search:
        # Search in all language fields
        query["$or"] = [
            {f"title_{language}": {"$regex": search, "$options": "i"}},
            {f"author_{language}": {"$regex": search, "$options": "i"}},
            {f"description_{language}": {"$regex": search, "$options": "i"}}
        ]
    
    books = await db.books.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"books": books}

@api_router.get("/books/{book_id}")
async def get_book(book_id: str):
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Kitab tapılmadı")
    return book

@api_router.post("/books/{book_id}/view")
async def increment_book_view(book_id: str):
    """Increment view count - should be called only once per page visit"""
    result = await db.books.update_one({"id": book_id}, {"$inc": {"views": 1}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kitab tapılmadı")
    return {"success": True}

@api_router.get("/books/user/my-books")
async def get_my_books(current_user: dict = Depends(get_current_user)):
    books = await db.books.find({"seller_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"books": books}

@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str, current_user: dict = Depends(get_current_user)):
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Kitab tapılmadı")
    
    if book["seller_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bu kitabı silmək üçün icazəniz yoxdur")
    
    await db.books.delete_one({"id": book_id})
    await db.reviews.delete_many({"book_id": book_id})
    await db.favorites.delete_many({"book_id": book_id})
    
    return {"message": "Kitab silindi"}

@api_router.put("/books/{book_id}")
async def update_book(
    book_id: str,
    title_az: str = Form(...),
    title_en: str = Form(...),
    title_ru: str = Form(...),
    author_az: str = Form(...),
    author_en: str = Form(...),
    author_ru: str = Form(...),
    description_az: str = Form(...),
    description_en: str = Form(...),
    description_ru: str = Form(...),
    category: str = Form(...),
    price: float = Form(0),
    is_paid: bool = Form(False),
    pdf_file: Optional[UploadFile] = File(None),
    demo_pdf_file: Optional[UploadFile] = File(None),
    cover_image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Kitab tapılmadı")
    
    if book["seller_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bu kitabı redaktə etmək üçün icazəniz yoxdur")
    
    update_data = {
        "title_az": title_az,
        "title_en": title_en,
        "title_ru": title_ru,
        "author_az": author_az,
        "author_en": author_en,
        "author_ru": author_ru,
        "description_az": description_az,
        "description_en": description_en,
        "description_ru": description_ru,
        "category": category,
        "price": price if is_paid else 0,
        "is_paid": is_paid
    }
    
    # Update PDF if new one provided
    if pdf_file:
        pdf_content = await pdf_file.read()
        pdf_url = await upload_to_r2(pdf_content, pdf_file.filename, 'application/pdf')
        update_data["pdf_file"] = pdf_url
    
    # Update demo PDF if provided
    if demo_pdf_file:
        demo_content = await demo_pdf_file.read()
        demo_url = await upload_to_r2(demo_content, demo_pdf_file.filename, 'application/pdf')
        update_data["demo_pdf_file"] = demo_url
    
    # Update cover image if provided
    if cover_image:
        cover_content = await cover_image.read()
        cover_url = await upload_to_r2(cover_content, cover_image.filename, cover_image.content_type)
        update_data["cover_image"] = cover_url
    
    await db.books.update_one({"id": book_id}, {"$set": update_data})
    return {"message": "Kitab yeniləndi"}

# Admin - Book Management  
@api_router.get("/admin/books")
async def admin_get_all_books(admin: dict = Depends(get_admin_user)):
    books = await db.books.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"books": books}

# Favorite routes
@api_router.post("/books/{book_id}/favorite")
async def toggle_favorite(book_id: str, current_user: dict = Depends(get_current_user)):
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Kitab tapılmadı")
    
    existing = await db.favorites.find_one({"user_id": current_user["id"], "book_id": book_id}, {"_id": 0})
    
    if existing:
        await db.favorites.delete_one({"user_id": current_user["id"], "book_id": book_id})
        return {"message": "Favoritlərdən silindi", "is_favorite": False}
    else:
        fav_id = str(uuid.uuid4())
        await db.favorites.insert_one({
            "id": fav_id,
            "user_id": current_user["id"],
            "book_id": book_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"message": "Favoritlərə əlavə edildi", "is_favorite": True}

@api_router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    book_ids = [fav["book_id"] for fav in favorites]
    
    books = await db.books.find({"id": {"$in": book_ids}}, {"_id": 0}).to_list(1000)
    return {"books": books}

@api_router.get("/books/{book_id}/is-favorite")
async def check_favorite(book_id: str, current_user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": current_user["id"], "book_id": book_id}, {"_id": 0})
    return {"is_favorite": existing is not None}

# Review routes (continuing with existing implementation)
@api_router.post("/books/{book_id}/reviews")
async def create_review(
    book_id: str, 
    rating: int = Form(...), 
    comment: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Kitab tapılmadı")
    
    existing = await db.reviews.find_one({"book_id": book_id, "user_id": current_user["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Siz artıq bu kitabı qiymətləndirmisiniz")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "book_id": book_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    reviews = await db.reviews.find({"book_id": book_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.books.update_one(
        {"id": book_id},
        {"$set": {"avg_rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
    )
    
    return {"message": "Rəy əlavə edildi"}

@api_router.get("/books/{book_id}/reviews")
async def get_reviews(book_id: str):
    reviews = await db.reviews.find({"book_id": book_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"reviews": reviews}

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Rəy tapılmadı")
    
    if review["user_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bu rəyi silmək üçün icazəniz yoxdur")
    
    await db.reviews.delete_one({"id": review_id})
    
    book_id = review["book_id"]
    reviews = await db.reviews.find({"book_id": book_id}, {"_id": 0}).to_list(1000)
    
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"avg_rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
        )
    else:
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"avg_rating": 0.0, "reviews_count": 0}}
        )
    
    return {"message": "Rəy silindi"}

@api_router.get("/admin/reviews")
async def admin_get_all_reviews(admin: dict = Depends(get_admin_user)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"reviews": reviews}

# Banner Management - Multiple Banners for Slider
@api_router.post("/admin/banners")
async def add_banner(
    banner_image: UploadFile = File(...),
    title: str = Form(""),
    link: str = Form(""),
    admin: dict = Depends(get_admin_user)
):
    image_content = await banner_image.read()
    image_url = await upload_to_r2(image_content, banner_image.filename, banner_image.content_type)
    
    banner_doc = {
        "id": str(uuid.uuid4()),
        "image_url": image_url,
        "title": title,
        "link": link,
        "order": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.banners.insert_one(banner_doc)
    
    # Return without _id
    banner_doc.pop("_id", None)
    return {"message": "Banner əlavə edildi", "banner": banner_doc}

@api_router.get("/banners")
async def get_banners():
    banners = await db.banners.find({}, {"_id": 0}).sort("order", 1).to_list(20)
    return {"banners": banners}

@api_router.delete("/admin/banners/{banner_id}")
async def delete_banner(banner_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.banners.delete_one({"id": banner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner tapılmadı")
    return {"message": "Banner silindi"}

@api_router.put("/admin/banners/{banner_id}/order")
async def update_banner_order(banner_id: str, order: int, admin: dict = Depends(get_admin_user)):
    await db.banners.update_one({"id": banner_id}, {"$set": {"order": order}})
    return {"message": "Sıra yeniləndi"}

# Legacy single banner (keep for backwards compatibility)
@api_router.post("/admin/banner")
async def upload_banner(
    banner_image: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    admin: dict = Depends(get_admin_user)
):
    image_content = await banner_image.read()
    image_url = await upload_to_r2(image_content, banner_image.filename, banner_image.content_type)
    
    banner_doc = {
        "image_url": image_url,
        "title": title,
        "description": description,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.settings.update_one(
        {"key": "banner"},
        {"$set": {"key": "banner", "value": banner_doc}},
        upsert=True
    )
    
    return {"message": "Banner yeniləndi", "banner": banner_doc}

@api_router.get("/banner")
async def get_banner():
    banner = await db.settings.find_one({"key": "banner"}, {"_id": 0})
    if not banner:
        return {"banner": None}
    return {"banner": banner.get("value")}

# Page Content Management (CMS) with multi-language
@api_router.put("/admin/pages/{page}")
async def update_page_content(
    page: str,
    title_az: str = Form(...),
    title_en: str = Form(...),
    title_ru: str = Form(...),
    content_az: str = Form(...),
    content_en: str = Form(...),
    content_ru: str = Form(...),
    admin: dict = Depends(get_admin_user)
):
    if page not in ["haqqimizda", "elaqe", "xidmetlerimiz", "ikinciel"]:
        raise HTTPException(status_code=400, detail="Yanlış səhifə adı")
    
    page_doc = {
        "page": page,
        "title_az": title_az,
        "title_en": title_en,
        "title_ru": title_ru,
        "content_az": content_az,
        "content_en": content_en,
        "content_ru": content_ru,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pages.update_one(
        {"page": page},
        {"$set": page_doc},
        upsert=True
    )
    
    return {"message": "Səhifə yeniləndi"}

@api_router.get("/pages/{page}")
async def get_page_content(page: str, language: str = "az"):
    page_data = await db.pages.find_one({"page": page}, {"_id": 0})
    if not page_data:
        default_content = {
            "haqqimizda": {"title": "Haqqımızda", "content": "E-Kitab platforması haqqında məlumat..."},
            "elaqe": {"title": "Əlaqə", "content": "Bizimlə əlaqə saxlayın..."},
            "xidmetlerimiz": {"title": "Xidmətlərimiz", "content": "Xidmətlərimiz haqqında məlumat..."},
            "ikinciel": {"title": "2-ci əl kitablar", "content": "2-ci əl kitablar haqqında..."}
        }
        if page in default_content:
            return {"page": page, **default_content[page], "updated_at": None}
        raise HTTPException(status_code=404, detail="Səhifə tapılmadı")
    
    return {
        "page": page,
        "title": page_data.get(f"title_{language}", page_data.get("title_az")),
        "content": page_data.get(f"content_{language}", page_data.get("content_az")),
        "updated_at": page_data.get("updated_at")
    }

@api_router.get("/categories")
async def get_categories():
    # Return only the 3 main categories
    return {"categories": ["Kitab", "PDF Kitab", "2-ci əl kitab"]}

# Services Management
class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title_az: str
    title_en: str
    title_ru: str
    description_az: str
    description_en: str
    description_ru: str
    price: float
    is_free: bool
    image_url: Optional[str] = None
    whatsapp: str
    created_at: str

@api_router.post("/admin/services")
async def create_service(
    title_az: str = Form(...),
    title_en: str = Form(...),
    title_ru: str = Form(...),
    description_az: str = Form(...),
    description_en: str = Form(...),
    description_ru: str = Form(...),
    price: float = Form(0),
    is_free: bool = Form(True),
    whatsapp: str = Form(...),
    image: Optional[UploadFile] = File(None),
    admin: dict = Depends(get_admin_user)
):
    service_id = str(uuid.uuid4())
    
    # Upload image if provided
    image_url = None
    if image:
        image_content = await image.read()
        image_url = await upload_to_r2(image_content, image.filename, image.content_type)
    
    service_doc = {
        "id": service_id,
        "title_az": title_az,
        "title_en": title_en,
        "title_ru": title_ru,
        "description_az": description_az,
        "description_en": description_en,
        "description_ru": description_ru,
        "price": price if not is_free else 0,
        "is_free": is_free,
        "image_url": image_url,
        "whatsapp": whatsapp,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.services.insert_one(service_doc)
    return {"message": "Xidmət əlavə edildi", "service_id": service_id}

@api_router.get("/services")
async def get_services():
    services = await db.services.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"services": services}

@api_router.get("/services/{service_id}")
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Xidmət tapılmadı")
    return service

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Xidmət tapılmadı")
    return {"message": "Xidmət silindi"}

@api_router.put("/admin/services/{service_id}")
async def update_service(
    service_id: str,
    title_az: str = Form(...),
    title_en: str = Form(...),
    title_ru: str = Form(...),
    description_az: str = Form(...),
    description_en: str = Form(...),
    description_ru: str = Form(...),
    price: float = Form(0),
    is_free: bool = Form(True),
    whatsapp: str = Form(...),
    image: Optional[UploadFile] = File(None),
    admin: dict = Depends(get_admin_user)
):
    update_data = {
        "title_az": title_az,
        "title_en": title_en,
        "title_ru": title_ru,
        "description_az": description_az,
        "description_en": description_en,
        "description_ru": description_ru,
        "price": price if not is_free else 0,
        "is_free": is_free,
        "whatsapp": whatsapp
    }
    
    if image:
        image_content = await image.read()
        image_url = await upload_to_r2(image_content, image.filename, image.content_type)
        update_data["image_url"] = image_url
    
    result = await db.services.update_one({"id": service_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Xidmət tapılmadı")
    return {"message": "Xidmət yeniləndi"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
