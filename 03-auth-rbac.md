# Plan 03 — Auth & RBAC (fluxuri de identitate)

> Citește întâi `00-context-comun.md`.

## Obiectiv
Implementează identitatea, înrolarea și gestiunea rolurilor, astfel încât fiecare utilizator să primească un context de tenant/rol de încredere.

## Ce deții
- Signup public → **primul utilizator devine Admin**; crearea atomică a tenantului + profil admin + echipă default.
- **Invitații** prin email: one-time, expirabile, rate-limited, plus acceptarea lor.
- Injectarea claim-urilor de tenant/rol în token la fiecare emitere/refresh.
- Gestiunea rolurilor: doar adminul schimbă roluri; utilizatorul **nu** își poate schimba propriul rol/tenant; protecția ultimului admin; dezactivare soft.
- Echipe și constrângerea de **manager unic per echipă**.
- Guards în aplicație (fail-fast pentru UX) și redirecționarea pe bază de sesiune. Autoritatea finală rămâne RLS.
- **Ecranele de administrare** (echipe, utilizatori, invitații) prin care adminul gestionează echipele, rolurile și invitațiile, peste backend-ul de mai sus.

## Dependențe
02 (framework RLS + suită de izolare).

## Granițe
Nu implementezi entitățile CRM. Reutilizezi framework-ul și suita de izolare din Planul 02 pentru tabelele de identitate.

## Criteriu de acceptare
Suita de izolare trece pe tabelele de identitate; un utilizator nu-și poate escalada rolul sau schimba tenantul; funcțiile privilegiate nu pot fi apelate direct de utilizatorii obișnuiți.
