"use client";
import { create } from "zustand";
import type { AddressResponse } from "@/types/api/address.types";

interface AddressState {
  addresses: AddressResponse[];
  selectedAddress: AddressResponse | null;
  loading: boolean;
  error: string | null;
  // Actions
  setAddresses: (addresses: AddressResponse[]) => void;
  upsertAddress: (address: AddressResponse) => void;
  removeAddress: (id: string) => void;
  setSelectedAddress: (address: AddressResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // Derived
  getDefaultAddress: () => AddressResponse | undefined;
}

export const useAddressStore = create<AddressState>()((set, get) => ({
  addresses: [],
  selectedAddress: null,
  loading: false,
  error: null,

  setAddresses: (addresses) => set({ addresses }),

  upsertAddress: (address) => {
    const existing = get().addresses.find((a) => a.id === address.id);
    set({
      addresses: existing
        ? get().addresses.map((a) => (a.id === address.id ? address : a))
        : [...get().addresses, address],
    });
  },

  removeAddress: (id) =>
    set({ addresses: get().addresses.filter((a) => a.id !== id) }),

  setSelectedAddress: (selectedAddress) => set({ selectedAddress }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  getDefaultAddress: () => get().addresses.find((a) => a.isDefault),
}));
