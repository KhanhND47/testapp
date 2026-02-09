import React, { useState, useEffect } from 'react';
import type { RepairType } from '../../lib/supabase';
import { api } from '../../lib/api/client';
import { X, Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronRight, Edit } from 'lucide-react';

interface EditRepairOrderModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubItemInput {
  id: string;
  name: string;
  dbId?: string;
}

interface ItemInput {
  id: string;
  name: string;
  repairType: RepairType | null;
  subItems: SubItemInput[];
  expanded: boolean;
  dbId?: string;
}

export default function EditRepairOrderModal({ orderId, onClose, onSuccess }: EditRepairOrderModalProps) {
  const [licensePlate, setLicensePlate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [receiveDate, setReceiveDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [items, setItems] = useState<ItemInput[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<RepairType | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingSubItemFor, setAddingSubItemFor] = useState<string | null>(null);
  const [newSubItemName, setNewSubItemName] = useState('');
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    setLoading(true);

    try {
      const data = await api.get<{
        order: any;
        items: any[];
      }>('api-repairs', `/${orderId}/detail`, { role: 'admin' });

      if (data?.order) {
        const orderData = data.order;
        setLicensePlate(orderData.license_plate);
        setCustomerName(orderData.customer_name);
        setVehicleName(orderData.vehicle_name);
        setReceiveDate(orderData.receive_date);
        setReturnDate(orderData.return_date);
      }

      if (data?.items) {
        const allItems = data.items;
        const parentItems = allItems.filter((i: any) => !i.parent_id);

        const hierarchicalItems: ItemInput[] = parentItems.map((parent: any) => ({
          id: crypto.randomUUID(),
          dbId: parent.id,
          name: parent.name,
          repairType: parent.repair_type,
          expanded: false,
          subItems: (parent.children || []).map((child: any) => ({
            id: crypto.randomUUID(),
            dbId: child.id,
            name: child.name,
          })),
        }));

        setItems(hierarchicalItems);
      }
    } catch (err) {
      console.error('Error fetching order data:', err);
    }

    setLoading(false);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    setItems([...items, {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      repairType: newItemType || null,
      subItems: [],
      expanded: false,
    }]);
    setNewItemName('');
    setNewItemType('');
  };

  const removeItem = (id: string, dbId?: string) => {
    if (dbId) {
      setDeletedItemIds([...deletedItemIds, dbId]);
    }
    setItems(items.filter(i => i.id !== id));
  };

  const updateItemName = (id: string, newName: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, name: newName } : item
    ));
  };

  const updateItemType = (id: string, newType: RepairType | null) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, repairType: newType } : item
    ));
  };

  const toggleExpand = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, expanded: !item.expanded } : item
    ));
  };

  const addSubItem = (parentId: string) => {
    if (!newSubItemName.trim()) return;
    setItems(items.map(item =>
      item.id === parentId
        ? {
            ...item,
            subItems: [...item.subItems, { id: crypto.randomUUID(), name: newSubItemName.trim() }],
            expanded: true,
          }
        : item
    ));
    setNewSubItemName('');
    setAddingSubItemFor(null);
  };

  const removeSubItem = (parentId: string, subItemId: string, dbId?: string) => {
    if (dbId) {
      setDeletedItemIds([...deletedItemIds, dbId]);
    }
    setItems(items.map(item =>
      item.id === parentId
        ? { ...item, subItems: item.subItems.filter(si => si.id !== subItemId) }
        : item
    ));
  };

  const updateSubItemName = (parentId: string, subItemId: string, newName: string) => {
    setItems(items.map(item =>
      item.id === parentId
        ? {
            ...item,
            subItems: item.subItems.map(si =>
              si.id === subItemId ? { ...si, name: newName } : si
            ),
          }
        : item
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const handleSubItemKeyDown = (e: React.KeyboardEvent, parentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubItem(parentId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licensePlate.trim()) {
      setError('Vui long nhap bien so xe');
      return;
    }
    if (!customerName.trim()) {
      setError('Vui long nhap ten khach hang');
      return;
    }
    if (!vehicleName.trim()) {
      setError('Vui long nhap ten xe');
      return;
    }
    if (!receiveDate) {
      setError('Vui long chon ngay nhan xe');
      return;
    }
    if (!returnDate) {
      setError('Vui long chon ngay tra xe');
      return;
    }
    if (items.length === 0) {
      setError('Vui long them it nhat 1 hang muc sua chua');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.put('api-repairs', `/${orderId}`, {
        licensePlate: licensePlate.toUpperCase().trim(),
        customerName: customerName.trim(),
        vehicleName: vehicleName.trim(),
        receiveDate,
        returnDate,
        deletedItemIds,
        items: items.map((item, index) => ({
          dbId: item.dbId,
          name: item.name,
          repairType: item.repairType,
          orderIndex: index,
          subItems: item.subItems.map((si, si_idx) => ({
            dbId: si.dbId,
            name: si.name,
            orderIndex: si_idx,
          })),
        })),
      });

      setSaving(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Co loi xay ra');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fullscreen-modal">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-4">Dang tai...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-modal">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 flex items-center h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button onClick={onClose} className="w-14 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="flex-1 text-center font-bold text-white truncate flex items-center justify-center gap-2">
          <Edit className="w-5 h-5" />
          Chinh sua lenh sua chua
        </h2>
        <div className="w-14" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-safe-bottom overflow-y-auto space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Bien so xe *
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="input-field uppercase font-mono text-lg"
              placeholder="VD: 30A-12345"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ten khach hang *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field"
              placeholder="Nhap ten khach hang"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Ten xe *
          </label>
          <input
            type="text"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
            className="input-field"
            placeholder="VD: Toyota Camry 2023"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ngay nhan xe *
            </label>
            <input
              type="date"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ngay tra xe (du kien) *
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Cac hang muc sua chua *
          </label>

          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field"
              placeholder="Nhap ten hang muc..."
            />
            <div className="flex gap-2">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as RepairType | '')}
                className="input-field flex-1"
              >
                <option value="">Chon loai</option>
                <option value="sua_chua">Sua Chua</option>
                <option value="dong_son">Dong Son</option>
              </select>
              <button
                type="button"
                onClick={addItem}
                className="btn-primary flex items-center justify-center gap-1 px-4"
              >
                <Plus className="w-5 h-5" />
                Them
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
              Chua co hang muc nao. Nhap ten hang muc va nhan "Them".
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const hasSubItems = item.subItems.length > 0;

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                      {hasSubItems ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 active:bg-gray-200 rounded-lg"
                        >
                          {item.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      ) : (
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 bg-white rounded-full border border-gray-200">
                          {index + 1}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemName(item.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-medium text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <select
                        value={item.repairType || ''}
                        onChange={(e) => updateItemType(item.id, (e.target.value as RepairType) || null)}
                        className="px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Loai</option>
                        <option value="sua_chua">SC</option>
                        <option value="dong_son">DS</option>
                      </select>
                      {hasSubItems && (
                        <span className="text-xs text-gray-500">({item.subItems.length})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAddingSubItemFor(item.id);
                          setItems(items.map(i => i.id === item.id ? { ...i, expanded: true } : i));
                        }}
                        className="w-8 h-8 flex items-center justify-center text-red-600 active:bg-red-50 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.dbId)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 active:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.expanded && hasSubItems && (
                      <div className="ml-8 space-y-1">
                        {item.subItems.map((subItem, subIndex) => (
                          <div key={subItem.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                            <span className="w-5 h-5 flex items-center justify-center text-xs text-gray-400">
                              {subIndex + 1}.
                            </span>
                            <input
                              type="text"
                              value={subItem.name}
                              onChange={(e) => updateSubItemName(item.id, subItem.id, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeSubItem(item.id, subItem.id, subItem.dbId)}
                              className="w-7 h-7 flex items-center justify-center text-red-400 active:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {addingSubItemFor === item.id && (
                      <div className="ml-8 p-2.5 bg-red-50/50 border border-dashed border-red-200 rounded-xl space-y-2">
                        <input
                          type="text"
                          value={newSubItemName}
                          onChange={(e) => setNewSubItemName(e.target.value)}
                          onKeyDown={(e) => handleSubItemKeyDown(e, item.id)}
                          className="input-field text-sm"
                          placeholder="Ten hang muc con..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addSubItem(item.id)}
                            className="btn-primary flex-1 text-sm py-2.5"
                          >
                            Them
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingSubItemFor(null);
                              setNewSubItemName('');
                            }}
                            className="btn-secondary flex-1 text-sm py-2.5"
                          >
                            Huy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 pb-safe-bottom border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Huy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Dang luu...' : 'Luu thay doi'}
          </button>
        </div>
      </form>
    </div>
  );
}
