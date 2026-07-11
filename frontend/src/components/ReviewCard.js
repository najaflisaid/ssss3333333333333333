import { Star } from "lucide-react";

const ReviewCard = ({ review }) => {
  return (
    <div data-testid={`review-${review.id}`} className="border border-border rounded-lg p-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{review.user_name}</h4>
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString('az-AZ')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed">{review.comment}</p>
    </div>
  );
};

export default ReviewCard;