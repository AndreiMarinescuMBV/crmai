\#\# Table \`tenants\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`name\` | \`text\` |  |  
| \`created\_at\` | \`timestamptz\` |  |

\#\# Table \`profiles\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`email\` | \`text\` |  |  
| \`full\_name\` | \`text\` |  Nullable |  
| \`role\` | \`app\_role\` |  |  
| \`is\_active\` | \`bool\` |  |  
| \`created\_at\` | \`timestamptz\` |  |

\#\# Table \`teams\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`name\` | \`text\` |  |  
| \`created\_at\` | \`timestamptz\` |  |

\#\# Table \`team\_memberships\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`team\_id\` | \`uuid\` |  |  
| \`user\_id\` | \`uuid\` |  |  
| \`role\_in\_team\` | \`team\_role\` |  |  
| \`created\_at\` | \`timestamptz\` |  |

\#\# Table \`invitations\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`email\` | \`text\` |  |  
| \`role\` | \`app\_role\` |  |  
| \`team\_id\` | \`uuid\` |  Nullable |  
| \`token\_hash\` | \`text\` |  |  
| \`status\` | \`invitation\_status\` |  |  
| \`invited\_by\` | \`uuid\` |  Nullable |  
| \`expires\_at\` | \`timestamptz\` |  |  
| \`created\_at\` | \`timestamptz\` |  |

\#\# Table \`clients\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`owner\_id\` | \`uuid\` |  |  
| \`team\_id\` | \`uuid\` |  Nullable |  
| \`name\` | \`text\` |  |  
| \`company\` | \`text\` |  Nullable |  
| \`industry\` | \`text\` |  Nullable |  
| \`notes\` | \`text\` |  Nullable |  
| \`created\_at\` | \`timestamptz\` |  |  
| \`updated\_at\` | \`timestamptz\` |  |

\#\# Table \`contacts\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`client\_id\` | \`uuid\` |  |  
| \`full\_name\` | \`text\` |  |  
| \`email\` | \`text\` |  Nullable |  
| \`phone\` | \`text\` |  Nullable |  
| \`position\` | \`text\` |  Nullable |  
| \`is\_primary\` | \`bool\` |  |  
| \`created\_at\` | \`timestamptz\` |  |

\#\# Table \`deals\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`owner\_id\` | \`uuid\` |  |  
| \`team\_id\` | \`uuid\` |  Nullable |  
| \`client\_id\` | \`uuid\` |  |  
| \`title\` | \`text\` |  |  
| \`value\_ron\` | \`numeric\` |  |  
| \`stage\` | \`deal\_stage\` |  |  
| \`lost\_reason\` | \`text\` |  Nullable |  
| \`expected\_close\_date\` | \`date\` |  Nullable |  
| \`last\_activity\_at\` | \`timestamptz\` |  |  
| \`created\_at\` | \`timestamptz\` |  |  
| \`updated\_at\` | \`timestamptz\` |  |

\#\# Table \`activities\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`owner\_id\` | \`uuid\` |  |  
| \`team\_id\` | \`uuid\` |  Nullable |  
| \`deal\_id\` | \`uuid\` |  Nullable |  
| \`client\_id\` | \`uuid\` |  Nullable |  
| \`type\` | \`activity\_type\` |  |  
| \`subject\` | \`text\` |  |  
| \`body\` | \`text\` |  Nullable |  
| \`occurred\_at\` | \`timestamptz\` |  |  
| \`created\_at\` | \`timestamptz\` |  |

\#\# Table \`deal\_stage\_history\`

\#\#\# Columns

| Name | Type | Constraints |  
|------|------|-------------|  
| \`id\` | \`uuid\` | Primary |  
| \`tenant\_id\` | \`uuid\` |  |  
| \`deal\_id\` | \`uuid\` |  |  
| \`from\_stage\` | \`deal\_stage\` |  Nullable |  
| \`to\_stage\` | \`deal\_stage\` |  |  
| \`changed\_by\` | \`uuid\` |  Nullable |  
| \`changed\_at\` | \`timestamptz\` |  |

