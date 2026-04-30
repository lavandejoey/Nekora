// desktop/src/components/StatusIndicator.tsx
interface StatusIndicatorProps {
  status: "Ready" | "Loading";
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="status-indicator">
      <span className="status-dot" />
      {status}
    </div>
  );
}
