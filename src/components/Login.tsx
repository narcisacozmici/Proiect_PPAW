import { SignIn, SignUp } from '@clerk/clerk-react'
import { useState } from 'react'

const sharedAppearance = {
  elements: {
    rootBox: "mx-auto w-full",
    card: "shadow-none bg-transparent p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    footer: "hidden",
    footerActionLink: "hidden",
    socialButtonsBlockButton:
      "w-full max-w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium py-3 px-4 rounded-lg text-sm mb-4 box-border",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    socialButtonsBlockButton__lastUsed: "hidden",
    dividerLine: "bg-gray-200 my-4",
    dividerText: "text-gray-500 text-xs font-medium uppercase tracking-wide",
    formButtonPrimary:
      "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-sm mt-4",
    formFieldLabel: "text-gray-700 font-semibold text-sm mb-1.5",
    formField: "mb-4",
    formFieldInput:
      "w-full max-w-full border border-gray-300 focus:border-blue-500 focus:ring-0 focus:outline-none rounded-lg transition-all duration-200 py-2.5 px-3 text-sm box-border",
    formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
    formFieldErrorText: "text-red-600 text-xs mt-1",
    formFieldSuccessText: "text-green-600 text-xs mt-1",
    identityPreviewText: "text-gray-700 text-sm",
    identityPreviewEditButton: "text-blue-600 hover:text-blue-700 text-sm",
    formResendCodeLink: "text-blue-600 hover:text-blue-700 text-sm",
    otpCodeFieldInput:
      "border border-gray-300 focus:border-blue-500 focus:ring-0 focus:outline-none rounded-lg text-sm",
    alertText: "text-sm",
    formFieldInput__password:
      "w-full max-w-full border border-gray-300 focus:border-blue-500 focus:ring-0 focus:outline-none rounded-lg transition-all duration-200 py-2.5 px-3 text-sm box-border",
  },
  variables: {
    colorPrimary: "#2563eb",
    colorText: "#111827",
    colorTextSecondary: "#6b7280",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#111827",
    borderRadius: "0.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
}

function Login() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div> */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            PDF to Word
          </h1>
          <p className="text-gray-600 text-base">
            {isSignUp
              ? 'Creează un cont pentru a începe conversia documentelor'
              : 'Convertește documentele tale PDF în format Word cu ușurință'}
          </p>
        </div>

        {/* Auth Component */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          {isSignUp ? (
            <SignUp
              appearance={sharedAppearance}
              afterSignUpUrl="/"
            />
          ) : (
            <SignIn
              appearance={sharedAppearance}
              afterSignInUrl="/"
            />
          )}

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isSignUp ? (
                <>
                  Ai deja un cont?{' '}
                  <span className="text-blue-600 hover:text-blue-700 font-semibold">
                    Autentifică-te
                  </span>
                </>
              ) : (
                <>
                  Nu ai un cont?{' '}
                  <span className="text-blue-600 hover:text-blue-700 font-semibold">
                    Înregistrează-te
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
