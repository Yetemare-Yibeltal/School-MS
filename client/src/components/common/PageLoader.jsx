const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
    <div className="spinner-lg" />
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

export default PageLoader;
