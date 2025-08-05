import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--color-base-200)',
          '--normal-text': 'var(--color-base-content)',
          '--normal-border': 'var(--color-base-300)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
