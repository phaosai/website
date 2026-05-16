import { ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Mail } from "lucide-react";

interface Props {
  title: string;
  description: string;
  details?: string;
  children?: ReactNode;
  /** Render-prop style: get an onClick to attach to a custom trigger */
  asChild?: (open: () => void) => ReactNode;
}

/**
 * ShellExplainer — wraps any button/tile in the demo shell.
 * Clicking it opens a dialog that explains what the feature does,
 * with a "Contact Us" CTA to the standard inquiry form.
 */
export function ShellExplainer({ title, description, details, children, asChild }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {asChild ? (
        asChild(() => setOpen(true))
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-xl border border-border bg-card/50 p-5 hover:border-primary/40 hover:bg-card transition-all group"
        >
          {children ?? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-base">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              <p className="mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Click to learn more →
              </p>
            </>
          )}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {details && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed">
              {details}
            </div>
          )}

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mt-2">
            <p className="text-sm font-medium mb-3">
              Want to activate this on a live account?
            </p>
            <Link to="/contact" onClick={() => setOpen(false)}>
              <Button className="w-full gap-2">
                <Mail className="w-4 h-4" />
                Contact Us
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
