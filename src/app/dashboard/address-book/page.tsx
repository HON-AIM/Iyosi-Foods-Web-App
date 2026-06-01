"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Address = {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode?: string | null;
  country: string;
  isDefault: boolean;
};

export default function AddressBookPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Nigeria",
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/user/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.sort((a: Address, b: Address) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)));
      }
    } catch (error) {
      console.error("[ERROR] Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch("/api/user/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchAddresses();
        closeModal();
      } else {
         console.error("[ERROR] Failed to save address");
      }
    } catch (error) {
      console.error("[ERROR] Failed to save address", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error("[ERROR] Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (address?: Address) => {
    if (address) {
      setFormData({
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode || "",
        country: address.country,
        isDefault: address.isDefault,
      });
      setEditingId(address.id);
    } else {
      setFormData({
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Nigeria",
        isDefault: addresses.length === 0, // Auto default if first
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
         <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
         <button 
           onClick={() => openModal()}
           className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
         >
            Add New Address
         </button>
      </div>

      {loading && addresses.length === 0 ? (
          <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                  <div className="h-20 bg-gray-200 rounded w-full"></div>
              </div>
          </div>
      ) : addresses.length === 0 ? (
          <div className="text-center py-10">
              <p className="text-gray-500 mb-4">You have no saved addresses.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
             <div key={address.id} className="border border-gray-200 rounded-lg p-4 relative flex flex-col justify-between">
                 {address.isDefault && (
                    <div className="absolute top-4 right-4 text-xs font-semibold bg-primary-100 text-primary-800 px-2 py-1 rounded">
                      Default
                    </div>
                 )}
                 <div>
                    <h3 className="font-bold text-gray-900 mb-1">{session?.user?.name || "User"}</h3>
                    <p className="text-gray-600 text-sm">{address.street}</p>
                    <p className="text-gray-600 text-sm">{address.city}, {address.state} {address.postalCode}</p>
                    <p className="text-gray-600 text-sm mb-4">{address.country}</p>
                 </div>
                 
                 <div className="flex gap-4 text-sm font-medium text-primary-600 mt-4 border-t border-gray-100 pt-3">
                    <button onClick={() => openModal(address)} className="hover:text-primary-800 transition-colors uppercase tracking-wider text-xs">Edit</button>
                    {!address.isDefault && (
                        <button onClick={() => handleDelete(address.id)} className="hover:text-red-600 transition-colors uppercase tracking-wider text-xs">Delete</button>
                    )}
                 </div>
             </div>
            ))}
          </div>
      )}

      {/* Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">
                      {editingId ? "Edit Address" : "Add New Address"}
                  </h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
               </div>
               
               <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input 
                        type="text" name="street" value={formData.street} onChange={handleInputChange} required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" 
                        placeholder="123 Main St"
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input 
                            type="text" name="city" value={formData.city} onChange={handleInputChange} required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input 
                            type="text" name="state" value={formData.state} onChange={handleInputChange} required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code (Optional)</label>
                          <input 
                            type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <input 
                            type="text" name="country" value={formData.country} onChange={handleInputChange} required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-500"
                            readOnly
                          />
                      </div>
                  </div>
                  
                  <div className="flex items-center pt-2">
                       <input 
                          type="checkbox" id="isDefault" name="isDefault" 
                          checked={formData.isDefault} onChange={handleInputChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          disabled={addresses.length === 0} // Always default if first
                       />
                       <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                           Set as default address
                       </label>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                      <button 
                        type="button" onClick={closeModal}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                      >
                         {loading ? "Saving..." : "Save Address"}
                      </button>
                  </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
}
