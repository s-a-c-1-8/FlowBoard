import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-slate-500 transition hover:text-indigo-600"
      >
        <Home size={15} />
        Dashboard
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center gap-1"
          >
            <ChevronRight size={15} className="text-slate-300" />

            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-slate-500 transition hover:text-indigo-600"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-800">{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
