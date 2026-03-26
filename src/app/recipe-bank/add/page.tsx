import RecipeForm from '@/components/recipe-bank/RecipeForm';
import Link from 'next/link';

export default function AddRecipePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/recipe-bank" className="text-muted text-sm hover:text-foreground transition-colors">
          ← Back to Recipe Bank
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-3">✚ Add a Recipe</h1>
        <p className="text-muted text-sm mt-1">
          Describe any recipe. Carmy will adapt it to your profile and format it for the bank.
        </p>
      </div>
      <RecipeForm />
    </div>
  );
}
