import { firebaseConfigured } from '../lib/firebase';

export function FirebaseSetupBanner() {
  if (firebaseConfigured) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <h2 className="text-base font-bold text-slate-900 text-center mb-2">Firebase Setup Required</h2>
        <p className="text-sm text-slate-500 text-center mb-5">
          This app needs Firebase for real-time sync. Create a <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">.env.local</code> file with your Firebase credentials to get started.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 text-xs font-mono text-slate-600 space-y-1">
          <p className="text-slate-400 mb-2"># .env.local</p>
          <p>VITE_FIREBASE_API_KEY=...</p>
          <p>VITE_FIREBASE_AUTH_DOMAIN=...</p>
          <p>VITE_FIREBASE_PROJECT_ID=...</p>
          <p>VITE_FIREBASE_STORAGE_BUCKET=...</p>
          <p>VITE_FIREBASE_MESSAGING_SENDER_ID=...</p>
          <p>VITE_FIREBASE_APP_ID=...</p>
        </div>

        <div className="space-y-2 text-sm text-slate-500">
          <p className="font-medium text-slate-700">Steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create a project at <span className="text-fairway-600 font-medium">console.firebase.google.com</span></li>
            <li>Enable Firestore Database</li>
            <li>Add a web app and copy the config</li>
            <li>Create <code className="bg-slate-100 px-1 rounded">.env.local</code> from <code className="bg-slate-100 px-1 rounded">.env.example</code></li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
