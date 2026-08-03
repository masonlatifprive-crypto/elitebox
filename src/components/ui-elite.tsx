  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
  to?: string;
}




export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild, to, ...props }, ref) => {
    if (to) {
      return (
        <Link
          to={to}
          className={cn(
            'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
            variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
            variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            size === 'md' && 'h-10 px-4 py-2',
            size === 'sm' && 'h-9 rounded-md px-3',
            size === 'icon' && 'h-10 w-10',
            className
          )}
          {...(props as any)}
        />
      );
    }
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          size === 'md' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 rounded-md px-3',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      />
    );
  }
);




export const ButtonPrimary = Button;
export const ButtonGhost = (props: ButtonProps) => <Button {...props} variant="ghost" />;
export const ButtonNeon = (props: ButtonProps) => <Button {...props} variant="neon" />;




export const toast = { success: (msg: string) => console.log(msg), error: (msg: string) => console.error(msg) };
