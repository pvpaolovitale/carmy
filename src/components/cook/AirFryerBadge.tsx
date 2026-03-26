import { AirFryerSettings } from '@/types';

export default function AirFryerBadge({ settings }: { settings: AirFryerSettings }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">💨</span>
        <span className="font-semibold text-amber-400 text-sm">Air Fryer — Create Studio Crystal</span>
        {settings.preheat && (
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
            Preheat required
          </span>
        )}
      </div>
      <div className="flex gap-6 text-sm font-mono text-amber-200">
        <span>{settings.tempC}°C</span>
        <span>{Math.round(settings.tempC * 9 / 5 + 32)}°F</span>
        <span>{settings.durationMin} min</span>
      </div>
      {settings.notes && <p className="text-xs text-amber-300/70 mt-2">{settings.notes}</p>}
    </div>
  );
}
