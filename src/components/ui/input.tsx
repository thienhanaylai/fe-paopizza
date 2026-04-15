import * as React from "react";
import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
interface ImageInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  previewClassName?: string;
}

interface ImageInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  inputClassName?: string;
}

const ImageInput = React.forwardRef<HTMLInputElement, ImageInputProps>(
  ({ className, inputClassName, onChange, ...props }, ref) => {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(null);
      }

      if (onChange) {
        onChange(e);
      }
    };

    React.useEffect(() => {
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      };
    }, [previewUrl]);

    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg overflow-hidden transition-all duration-200",
          "w-full h-24 border-2 border-dashed bg-muted/20 hover:bg-muted/50",
          previewUrl ? "border-transparent shadow-sm" : "border-gray-300",
          className,
        )}
      >
        {previewUrl ? (
          <>

            <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10 ">
              <span className="text-white text-xs font-semibold">Đổi ảnh</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground z-0 pointer-events-none">
            <svg
              className="w-6 h-6 mb-1 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              ></path>
            </svg>
            <span className="text-xs font-medium">Tải ảnh lên</span>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          className={cn("absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20", inputClassName)}
          onChange={handleFileChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
ImageInput.displayName = "ImageInput";

export { Input, ImageInput };
