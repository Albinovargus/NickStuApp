import { Link } from 'react-router';
import { testModules } from '../features/modules/index.js';

export function ModulesHomePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Modules</h1>
      <ul className="grid gap-3 md:grid-cols-2">
        {testModules.map((module) => (
          <li key={module.id}>
            <Link
              to={module.path}
              className="block min-h-11 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
            >
              <p className="font-semibold">{module.title}</p>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
