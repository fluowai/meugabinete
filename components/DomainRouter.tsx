import React from 'react';

const SYSTEM_ROUTE_PREFIXES = [
  '/',
  '/login',
  '/register',
  '/onboarding',
  '/admin',
  '/gabinete',
  '/superadmin',
  '/consultoria',
  '/vendas',
  '/ajuda',
  '/impersonate',
];

interface DomainRouterProps {
  children: React.ReactNode;
}

const DomainRouter: React.FC<DomainRouterProps> = ({ children }) => {
  return <>{children}</>;
};

export const isSystemRoute = (pathname: string) => {
  const normalized = pathname || '/';
  return SYSTEM_ROUTE_PREFIXES.some((prefix) =>
    prefix === '/' ? normalized === '/' : normalized.startsWith(prefix)
  );
};

export default DomainRouter;
