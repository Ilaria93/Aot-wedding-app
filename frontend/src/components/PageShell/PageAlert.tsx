type PageAlertProps = {
  message: string;
};

/** Inline error alert shown below the page hero. */
export function PageAlert({ message }: PageAlertProps) {
  return (
    <div className="alert-card" role="alert">
      <p className="error-text error-text--flush">{message}</p>
    </div>
  );
}
