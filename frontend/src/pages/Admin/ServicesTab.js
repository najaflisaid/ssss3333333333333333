import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Trash2, Edit, Image as ImageIcon, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/.netlify/functions';

const ServicesTab = () => {
  const { language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [formData, setFormData] = useState({
    title_az: "",
    title_en: "",
    title_ru: "",
    description_az: "",
    description_en: "",
    description_ru: "",
    price: "",
    whatsapp: ""
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/services`);
      setServices(response.data.services || []);
    } catch (error) {
      toast.error('Xidmətlər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title_az: "",
      title_en: "",
      title_ru: "",
      description_az: "",
      description_en: "",
      description_ru: "",
      price: "",
      whatsapp: ""
    });
    setPreviewImage(null);
    setEditingService(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Determine if service is free based on price
      const price = formData.price ? parseFloat(formData.price) : 0;
      const is_free = !formData.price || price === 0;
      
      formDataToSend.append('title_az', formData.title_az);
      formDataToSend.append('title_en', formData.title_en);
      formDataToSend.append('title_ru', formData.title_ru);
      formDataToSend.append('description_az', formData.description_az);
      formDataToSend.append('description_en', formData.description_en);
      formDataToSend.append('description_ru', formData.description_ru);
      formDataToSend.append('price', price);
      formDataToSend.append('is_free', is_free);
      formDataToSend.append('whatsapp', formData.whatsapp);
      
      if (fileInputRef.current?.files[0]) {
        formDataToSend.append('image', fileInputRef.current.files[0]);
      }

      if (editingService) {
        await axios.put(`${BACKEND_URL}/api/admin/services/${editingService.id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Xidmət yeniləndi');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/services`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Xidmət əlavə edildi');
      }

      fetchServices();
      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      title_az: service.title_az || "",
      title_en: service.title_en || "",
      title_ru: service.title_ru || "",
      description_az: service.description_az || "",
      description_en: service.description_en || "",
      description_ru: service.description_ru || "",
      price: service.price > 0 ? service.price : "",
      whatsapp: service.whatsapp || ""
    });
    setPreviewImage(service.image_url);
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm(language === 'az' ? 'Bu xidməti silmək istədiyinizə əminsiniz?' : 'Are you sure you want to delete this service?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/admin/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xidmət silindi');
      fetchServices();
    } catch (error) {
      toast.error('Xidmət silinə bilmədi');
    }
  };

  if (loading) {
    return <div className="text-center py-8">{language === 'az' ? 'Yüklənir...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {language === 'az' ? 'Xidmətlər' : language === 'en' ? 'Services' : 'Услуги'} ({services.length})
        </h2>
        <Button 
          onClick={() => { resetForm(); setShowForm(!showForm); }} 
          className="rounded-full"
        >
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm 
            ? (language === 'az' ? 'Bağla' : 'Close') 
            : (language === 'az' ? 'Xidmət Əlavə Et' : 'Add Service')
          }
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border rounded-2xl p-6 space-y-6 bg-card">
          <h3 className="text-lg font-semibold">
            {editingService 
              ? (language === 'az' ? 'Xidməti Redaktə Et' : 'Edit Service')
              : (language === 'az' ? 'Yeni Xidmət' : 'New Service')
            }
          </h3>

          {/* Language Tabs */}
          <Tabs defaultValue="az" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="az">🇦🇿 AZ</TabsTrigger>
              <TabsTrigger value="en">🇬🇧 EN</TabsTrigger>
              <TabsTrigger value="ru">🇷🇺 RU</TabsTrigger>
            </TabsList>
            
            {['az', 'en', 'ru'].map((lang) => (
              <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
                <div>
                  <Label>{lang === 'az' ? 'Başlıq' : lang === 'en' ? 'Title' : 'Заголовок'}</Label>
                  <Input
                    value={formData[`title_${lang}`]}
                    onChange={(e) => setFormData({...formData, [`title_${lang}`]: e.target.value})}
                    required
                    className="mt-1 rounded-full"
                  />
                </div>
                <div>
                  <Label>{lang === 'az' ? 'Təsvir' : lang === 'en' ? 'Description' : 'Описание'}</Label>
                  <Textarea
                    value={formData[`description_${lang}`]}
                    onChange={(e) => setFormData({...formData, [`description_${lang}`]: e.target.value})}
                    required
                    rows={3}
                    className="mt-1 rounded-2xl"
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Common Fields */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <Label>{language === 'az' ? 'Qiymət (AZN) - boş buraxıla bilər' : 'Price (AZN) - optional'}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder={language === 'az' ? 'Qiymət yazılmasa pulsuz sayılır' : 'Leave empty for free'}
                className="mt-1 rounded-full"
              />
            </div>
            
            <div>
              <Label>{language === 'az' ? 'WhatsApp Nömrəsi' : 'WhatsApp Number'}</Label>
              <Input
                type="tel"
                placeholder="+994XXXXXXXXX"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                required
                className="mt-1 rounded-full"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>{language === 'az' ? 'Şəkil' : 'Image'}</Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="max-h-32 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                  <p>{language === 'az' ? 'Şəkil seçmək üçün klikləyin' : 'Click to select image'}</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full rounded-full">
            {submitting 
              ? (language === 'az' ? 'Göndərilir...' : 'Submitting...')
              : editingService 
                ? (language === 'az' ? 'Yenilə' : 'Update')
                : (language === 'az' ? 'Əlavə Et' : 'Add')
            }
          </Button>
        </form>
      )}

      {/* Services List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.id} className="border border-border rounded-2xl overflow-hidden bg-card">
            {service.image_url && (
              <img src={service.image_url} alt={service.title_az} className="w-full h-40 object-cover" />
            )}
            <div className="p-4 space-y-3">
              <h3 className="font-semibold">{service[`title_${language}`] || service.title_az}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {service[`description_${language}`] || service.description_az}
              </p>
              <div className="flex items-center justify-between">
                {service.price > 0 && (
                  <span className="font-bold">{service.price} AZN</span>
                )}
                {!service.price || service.price === 0 ? <span></span> : null}
                <a 
                  href={`https://wa.me/${service.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:text-[#128C7E]"
                >
                  <FaWhatsapp className="h-5 w-5" />
                </a>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => handleEdit(service)} className="flex-1 rounded-full">
                  <Edit className="h-4 w-4 mr-1" />
                  {language === 'az' ? 'Redaktə' : 'Edit'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)} className="rounded-full">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          {language === 'az' ? 'Heç bir xidmət yoxdur' : 'No services yet'}
        </div>
      )}
    </div>
  );
};

export default ServicesTab;
