import { useState, useEffect } from 'react';
import { api } from '../lib/api/client';
import { Search, Users, User, Phone, Building, Car, ScanLine } from 'lucide-react';
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal';
import PlateRecognitionModal from '../components/customers/PlateRecognitionModal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  company_name: string | null;
  customer_type: string;
  address: string | null;
  created_at: string;
  vehicle_count?: number;
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showPlateScanner, setShowPlateScanner] = useState(false);
  const [plateSearchResult, setPlateSearchResult] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.get<Customer[]>('api-customers', '/');
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
    setLoading(false);
  };

  const handlePlateRecognized = async (plate: string) => {
    setShowPlateScanner(false);
    setPlateSearchResult(plate);
    setSearchTerm(plate);

    try {
      const result = await api.get<{ customer_id: string } | null>('api-customers', '/search-plate', { plate });
      if (result && result.customer_id) {
        setSelectedCustomerId(result.customer_id);
      }
    } catch (error) {
      console.error('Error searching plate:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      (customer.company_name?.toLowerCase().includes(searchLower) || false)
    );

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'individual') return matchesSearch && customer.customer_type === 'individual';
    if (filterType === 'company') return matchesSearch && customer.customer_type === 'company';

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Khach Hang</h1>
        <p className="text-sm text-gray-600 mt-0.5">Quan ly thong tin khach hang</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tim ten, SDT, cong ty, bien so..."
              className="input-field w-full pl-9 pr-3 py-2.5 text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (plateSearchResult && e.target.value !== plateSearchResult) {
                  setPlateSearchResult(null);
                }
              }}
            />
          </div>
          <button
            onClick={() => setShowPlateScanner(true)}
            className="btn-primary flex items-center justify-center w-11 h-11 p-0"
          >
            <ScanLine className="w-5 h-5" />
          </button>
        </div>

        {plateSearchResult && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <ScanLine className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-blue-800 flex-1">
              Bien so: <span className="font-bold">{plateSearchResult}</span>
            </span>
            <button
              onClick={() => {
                setPlateSearchResult(null);
                setSearchTerm('');
              }}
              className="text-blue-600 font-medium min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              Xoa
            </button>
          </div>
        )}

        <div className="tab-bar">
          <button
            onClick={() => setFilterType('all')}
            className={filterType === 'all' ? 'tab-item-active' : 'tab-item'}
          >
            Tat ca ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('individual')}
            className={filterType === 'individual' ? 'tab-item-active' : 'tab-item'}
          >
            Ca nhan ({customers.filter(c => c.customer_type === 'individual').length})
          </button>
          <button
            onClick={() => setFilterType('company')}
            className={filterType === 'company' ? 'tab-item-active' : 'tab-item'}
          >
            Cong ty ({customers.filter(c => c.customer_type === 'company').length})
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="card p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Tong</p>
                <p className="text-lg font-bold text-gray-900">{customers.length}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="card p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Ca nhan</p>
                <p className="text-lg font-bold text-gray-900">
                  {customers.filter(c => c.customer_type === 'individual').length}
                </p>
              </div>
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="card p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Cong ty</p>
                <p className="text-lg font-bold text-gray-900">
                  {customers.filter(c => c.customer_type === 'company').length}
                </p>
              </div>
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Khong tim thay khach hang nao' : 'Chua co khach hang nao'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="card card-pressable p-4"
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    customer.customer_type === 'company' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    {customer.customer_type === 'company' ? (
                      <Building className="w-5 h-5 text-purple-600" />
                    ) : (
                      <User className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                    <span className={`status-badge text-xs ${
                      customer.customer_type === 'company'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.customer_type === 'company' ? 'Cong ty' : 'Ca nhan'}
                    </span>
                  </div>
                </div>

                {customer.company_name && (
                  <p className="text-sm text-gray-600 mb-2 pl-[52px]">
                    {customer.company_name}
                  </p>
                )}

                <div className="flex items-center gap-4 pl-[52px] text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" />
                    <span>{customer.vehicle_count} xe</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onUpdate={() => {
            fetchCustomers();
          }}
        />
      )}

      {showPlateScanner && (
        <PlateRecognitionModal
          onPlateRecognized={handlePlateRecognized}
          onClose={() => setShowPlateScanner(false)}
        />
      )}
    </div>
  );
}
