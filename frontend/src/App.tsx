import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Budget from '@/pages/Budget';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import Categories from '@/pages/Categories';
import Reports from '@/pages/Reports';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Budget />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
