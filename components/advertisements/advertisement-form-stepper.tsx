import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADVERTISEMENT_WIZARD_STEPS } from "./advertisement-form-schema";

type AdvertisementFormStepperProps = {
  currentStep: number;
};

export function AdvertisementFormStepper({
  currentStep,
}: AdvertisementFormStepperProps) {
  const steps = ADVERTISEMENT_WIZARD_STEPS;

  return (
    <div className="mb-8 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-stretch gap-1 px-1 sm:min-w-0 sm:justify-between sm:gap-0">
        {steps.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div key={step.id} className="flex items-center sm:flex-1">
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-colors sm:flex-1 sm:flex-row sm:justify-center sm:gap-2 sm:px-4",
                  active &&
                    "border-diplomat-green bg-diplomat-lightGreen/80 shadow-sm",
                  done && !active && "border-emerald-200 bg-emerald-50/60",
                  !active && !done && "border-border bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    active && "bg-diplomat-green text-white",
                    done && !active && "bg-emerald-600 text-white",
                    !active && !done && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "max-w-[5.5rem] text-center text-xs font-medium leading-tight sm:max-w-none sm:text-sm",
                    active && "text-diplomat-green",
                    done && !active && "text-emerald-800",
                    !active && !done && "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className="mx-0.5 hidden h-px w-4 shrink-0 bg-border sm:mx-2 sm:block sm:h-0 sm:w-0 sm:flex-1 sm:self-center sm:border-t sm:border-dashed"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
