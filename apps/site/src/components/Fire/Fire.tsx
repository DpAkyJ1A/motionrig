/** The "hellfire" mark for the hardest recipe: a two-tongue flame in ember colours. */
export function Fire({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8.2 1C8.6 3.6 12.5 5.4 12.5 9.6 12.5 12.6 10.4 15 8 15S3.5 12.8 3.5 10.2C3.5 8 4.8 6.6 5.8 5.6 5.9 7.2 6.6 8.1 7.4 8.4 6.9 5.8 7.4 3 8.2 1Z"
        fill="#ff5a36"
      />
      <path d="M8 15C6.6 15 5.6 13.9 5.6 12.5 5.6 11 6.8 10.2 7.6 9 8 10.4 10.4 11 10.4 12.6 10.4 14 9.4 15 8 15Z" fill="#ffd400" />
    </svg>
  );
}
