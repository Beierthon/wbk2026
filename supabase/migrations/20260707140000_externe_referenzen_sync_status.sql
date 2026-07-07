alter table public.externe_referenzen
  add column if not exists sync_status text check (
    sync_status in (
      'nicht_synchronisiert',
      'veraltet',
      'manuell_ueberschrieben',
      'importiert'
    )
  );

update public.externe_referenzen
set sync_status = case
  when id = 'erp-bestellung-8842' then 'importiert'
  when id = 'eap-kostenstelle-baugrund' then 'importiert'
  when id = 'eap-asset-drainage' then 'veraltet'
  when id = 'erp-material-drainage' then 'manuell_ueberschrieben'
  else sync_status
end
where id in (
  'erp-bestellung-8842',
  'eap-kostenstelle-baugrund',
  'eap-asset-drainage',
  'erp-material-drainage'
);
