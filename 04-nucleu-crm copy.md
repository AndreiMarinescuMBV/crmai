# Plan 04 — Nucleu CRM (model de date & operațiuni)

> Citește întâi `00-context-comun.md`.

## Obiectiv
Construiește inima operațională a CRM-ului: clienți, contacte, dealuri cu pipeline, activități.

## Ce deții
- Tabelele și relațiile: clienți, contacte, dealuri, activități (+ istoricul de stagii pentru rapoarte).
- **Constrângerile de business la nivel DB:** pipeline cu tranziții valide, motiv de pierdere obligatoriu, actualizarea „ultimei activități" pe deal.
- Policies RLS owner/echipă/admin pe **toate** tabelele CRM, folosind pattern-ul din Planul 02.
- Operațiunile de scriere (Server Actions) per domeniu, cu contract uniform și validare partajată client/server.
- Audit pe scrierile sensibile.

## Dependențe
03 (auth & RBAC), plus framework-ul RLS din 02.

## Granițe
Nu construiești UI-ul Kanban/ecranele (Planul 05). Nu implementezi taskuri/remindere/notificări/documente/AI.

## Criteriu de acceptare
Suita de izolare trece pe toate tabelele CRM; constrângerile de business sunt impuse de baza de date, nu doar de UI.
