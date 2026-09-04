"use client"
interface ToggleSwitchProps {
  enabled: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export default function ToggleSwitch({ enabled, onChange, label, description, disabled = false }: ToggleSwitchProps) {
  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mt-0.5
          ${enabled ? "bg-green-600" : "bg-gray-200"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
            ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={`text-sm font-semibold ${enabled ? "text-green-700" : "text-gray-700"}`}>
              {label} <span className={`text-xs font-bold ${enabled ? "text-green-600" : "text-gray-400"}`}>({enabled ? "ON" : "OFF"})</span>
            </span>
          )}
          {description && <span className="text-xs text-gray-500 mt-0.5">{description}</span>}
        </div>
      )}
    </div>
  )
}
