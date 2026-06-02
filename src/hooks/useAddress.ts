"use client";
import { useAddressStore } from "@/store/useAddressStore";
import addressService from "@/services/address.service";
import type { AddressRequest } from "@/types/api/address.types";

export const useAddress = () => {
  const {
    addresses,
    selectedAddress,
    loading,
    error,
    setAddresses,
    upsertAddress,
    removeAddress,
    setSelectedAddress,
    setLoading,
    setError,
    getDefaultAddress,
  } = useAddressStore();

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await addressService.getAll();
      setAddresses(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch addresses";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (data: AddressRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await addressService.create(data);
      const created = res.data.data!;
      upsertAddress(created);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create address";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (id: string, data: AddressRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await addressService.update(id, data);
      const updated = res.data.data!;
      upsertAddress(updated);
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update address";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await addressService.delete(id);
      removeAddress(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete address";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Optimistically updates all local addresses so UI reflects the change instantly
  const setDefaultAddress = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await addressService.setDefault(id);
      setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
      return res.data.data!;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set default address";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addresses,
    selectedAddress,
    defaultAddress: getDefaultAddress(),
    loading,
    error,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    setSelectedAddress,
  };
};
