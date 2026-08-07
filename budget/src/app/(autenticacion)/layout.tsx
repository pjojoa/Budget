export default function LayoutAutenticacion({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-lienzo p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="font-condensada text-2xl font-semibold tracking-wide text-tinta uppercase">Budget</div>
          <p className="mt-1 text-xs text-tinta-2">Presupuestos de obra civil — Marval</p>
        </div>
        {children}
      </div>
    </div>
  );
}
