export default function Footer() {
  return (
    <footer className="border-t border-border bg-slate-50 py-8">
      <div className="container mx-auto px-4 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} NexusCommerce. All rights reserved.
      </div>
    </footer>
  );
}
