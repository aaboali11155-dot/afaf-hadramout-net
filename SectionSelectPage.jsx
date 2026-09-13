import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users } from 'lucide-react';

export default function SectionSelectPage({ onSelectSection }) {
  const navigate = useNavigate();

  const handleSelect = (section) => {
    onSelectSection(section);
    navigate('/register');
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="text-center">
        <h1 className="section-title mb-3">اختر القسم المناسب</h1>
        <p className="mb-10 text-gray-600">اختر القسم الذي ينطبق عليك للمتابعة في التسجيل</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <button
          onClick={() => handleSelect('male')}
          className="group relative overflow-hidden rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
            <User size={40} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">قسم الشباب</h2>
          <p className="text-sm text-gray-600">للرجال الراغبين في الزواج الشرعي</p>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        <button
          onClick={() => handleSelect('female')}
          className="group relative overflow-hidden rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-colors group-hover:bg-rose-100">
            <Users size={40} strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">قسم البنات</h2>
          <p className="text-sm text-gray-600">للنساء الراغبات في الزواج الشرعي</p>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-rose-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        بالضغط على أحد القسمين فإنك تؤكد أن دخولك للمنصة بغرض الزواج الشرعي فقط.
      </p>
    </div>
  );
}