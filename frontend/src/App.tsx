import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';

const Budget = lazy(() => import('@/pages/Budget'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const Categories = lazy(() => import('@/pages/Categories'));
const Reports = lazy(() => import('@/pages/Reports'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Budget />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
