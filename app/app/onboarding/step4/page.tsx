"use client";

export default function OnboardingStep4() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Étape 4 : Finalisation</h1>

      <p className="text-gray-600 mb-6">
        Félicitations 🎉 Vous avez terminé la configuration de Relansia.
        <br />
        Vos clients ont été importés, vos paramètres boutique enregistrés et vos
        règles de relances définies.
      </p>

      <div className="flex justify-between mt-6">
        <a
          href="/app/onboarding/step3"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Précédent
        </a>
        <a
          href="/app/reminders"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Terminer →
        </a>
      </div>
    </div>
  );
}
