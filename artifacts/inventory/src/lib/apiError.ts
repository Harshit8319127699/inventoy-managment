export function getApiErrorMessage(error: unknown, fallback: string): string {
  const maybe = error as {
    data?: {
      message?: string;
      error?: string;
    };
    message?: string;
  };

  return maybe?.data?.message ?? maybe?.data?.error ?? maybe?.message ?? fallback;
}
