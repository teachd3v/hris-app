"use client";

import { useForm } from "react-hook-form";
import { PROVINCES, REGENCIES } from "@/lib/wilayah-data";

export interface PersonalFormValues {
  email: string;
  phone: string;
  nik: string;
  birth: string;
  gender: string;
  bloodType: string;
  nationality: string;
  maritalStatus: string;
  religion: string;
  address: string;
  ktpAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface Props {
  formId: string;
  defaultValues: PersonalFormValues;
  onSubmit: (values: PersonalFormValues) => void;
}

const labelCls =
  "block text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-1.5";
const inputCls =
  "w-full px-3 py-2 text-sm text-ink border border-line-2 rounded-lg bg-white focus:outline-none focus:border-[var(--red)] focus:ring-2 focus:ring-[rgba(220,38,38,0.1)] transition-colors disabled:bg-line disabled:cursor-not-allowed";

const sortByName = <T extends { name: string }>(list: T[]) =>
  [...list].sort((a, b) =>
    a.name.localeCompare(b.name, "id", { sensitivity: "base" }),
  );

const SORTED_PROVINCES = sortByName(PROVINCES);

export default function DataPersonalForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, handleSubmit, watch, setValue } =
    useForm<PersonalFormValues>({ defaultValues });

  const province = watch("province");
  const provinceField = register("province");

  const selectedProvince = PROVINCES.find((p) => p.name === province);
  const cities = selectedProvince
    ? sortByName(REGENCIES[selectedProvince.code] ?? [])
    : [];

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4"
    >
      <div>
        <label className={labelCls}>Email</label>
        <input type="email" className={inputCls} {...register("email")} />
      </div>
      <div>
        <label className={labelCls}>Telepon</label>
        <input type="tel" className={inputCls} {...register("phone")} />
      </div>
      <div>
        <label className={labelCls}>NIK</label>
        <input 
          type="text" 
          maxLength={16}
          placeholder="16 digit angka"
          className={inputCls} 
          {...register("nik")} 
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 16);
          }}
        />
      </div>
      <div>
        <label className={labelCls}>Tanggal Lahir</label>
        <input type="date" className={inputCls} {...register("birth")} />
      </div>
      <div>
        <label className={labelCls}>Jenis Kelamin</label>
        <select className={inputCls} {...register("gender")}>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Golongan Darah</label>
        <select className={inputCls} {...register("bloodType")}>
          <option value="">Pilih Golongan Darah</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="AB">AB</option>
          <option value="O">O</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Kewarganegaraan</label>
        <input type="text" className={inputCls} {...register("nationality")} />
      </div>
      <div>
        <label className={labelCls}>Status Pernikahan</label>
        <select className={inputCls} {...register("maritalStatus")}>
          <option value="Belum Menikah">Belum Menikah</option>
          <option value="Menikah">Menikah</option>
          <option value="Cerai">Cerai</option>
          <option value="Duda/Janda">Duda/Janda</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Agama</label>
        <input type="text" className={inputCls} {...register("religion")} />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>Alamat Sesuai KTP</label>
        <textarea rows={2} className={inputCls} {...register("ktpAddress")} />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>Alamat Domisili</label>
        <textarea rows={2} className={inputCls} {...register("address")} />
      </div>
      <div>
        <label className={labelCls}>Provinsi</label>
        <select
          className={inputCls}
          {...provinceField}
          onChange={(e) => {
            provinceField.onChange(e);
            setValue("city", "");
          }}
        >
          <option value="">Pilih provinsi</option>
          {SORTED_PROVINCES.map((p) => (
            <option key={p.code} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Kota / Kabupaten</label>
        <select className={inputCls} disabled={!province} {...register("city")}>
          <option value="">
            {!province ? "Pilih provinsi dulu" : "Pilih kota / kabupaten"}
          </option>
          {cities.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Kode Pos</label>
        <input type="text" className={inputCls} {...register("postalCode")} />
      </div>
      <div>
        <label className={labelCls}>Negara</label>
        <input type="text" className={inputCls} {...register("country")} />
      </div>
    </form>
  );
}
