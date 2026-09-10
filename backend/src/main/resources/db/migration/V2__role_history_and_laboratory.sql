-- P0.1: historized, derived Spring Security role (User.role stays the field
-- @PreAuthorize reads, but every change is now recorded here — see UserRoleSyncService).
create table user_role_history (
    id uuid not null,
    user_id uuid not null,
    role varchar(40) not null check (role in ('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER','PERMANENT_MEMBER','ASSOCIATE_MEMBER','PHD_STUDENT','RETIRED_MEMBER','FORMER_MEMBER')),
    source varchar(40) not null check (source in ('MANDATE_CHANGE','STATUS_CHANGE','ADMIN_OVERRIDE')),
    start_date date not null,
    end_date date,
    changed_by uuid,
    created_at timestamp(6) with time zone not null,
    primary key (id)
);

create index idx_user_role_history_user
    on user_role_history (user_id);

alter table if exists user_role_history
    add constraint fk_user_role_history_user
    foreign key (user_id)
    references users;

-- P0.4: institutional identity of the laboratory (CdC §4.1 — founding date and
-- other administrative/public information), a single logical row.
create table laboratory (
    deleted boolean not null,
    created_at timestamp(6) with time zone not null,
    deleted_at timestamp(6) with time zone,
    founding_date date,
    updated_at timestamp(6) with time zone,
    version bigint not null,
    created_by uuid,
    id uuid not null,
    updated_by uuid,
    name varchar(255) not null,
    description TEXT,
    director_message TEXT,
    primary key (id)
);
