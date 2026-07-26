export default function PriceText({
  amount,
  className = "",
  strikeThrough = false,
}: {
  amount: number | string | undefined;
  className?: string;
  strikeThrough?: boolean;
}) {
  const num = Number(amount || 0);
  if (!isFinite(num)) return null;
  const formatted = num.toLocaleString("en-IN", {
    maximumFractionDigits: strikeThrough ? 0 : 2,
    minimumFractionDigits: strikeThrough ? 0 : 2,
  });
  return (
    <span className={className}>
      <span className="text-[0.7em] align-baseline mr-0.5">Rs.</span>
      <span>{formatted}</span>
    </span>
  );
}
