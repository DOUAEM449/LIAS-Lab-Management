
    create table affiliation_history (
        end_date date,
        start_date date not null,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        member_id uuid not null,
        reason varchar(500),
        primary key (id)
    );

    create table agreements (
        deleted boolean not null,
        end_date date,
        start_date date,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        partner_id uuid not null,
        updated_by uuid,
        title varchar(300) not null,
        description TEXT,
        document_original_name varchar(255),
        document_path varchar(255),
        primary key (id)
    );

    create table annual_reports (
        deleted boolean not null,
        report_year integer not null unique,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        generated_date timestamp(6) with time zone not null,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        updated_by uuid,
        pdf_path varchar(255),
        statistics_json TEXT not null,
        primary key (id)
    );

    create table audit_logs (
        created_at timestamp(6) with time zone not null,
        actor_id uuid,
        id uuid not null,
        action varchar(40) not null check (action in ('CREATE','UPDATE','DELETE','RESTORE','APPROVE','REJECT','LOGIN','LOGIN_FAILED','LOGOUT','PASSWORD_RESET','ROLE_CHANGE','STATUS_CHANGE','FILE_UPLOAD','FILE_DOWNLOAD')),
        ip_address varchar(64),
        entity_id varchar(100),
        entity_type varchar(100) not null,
        actor_email varchar(190),
        details varchar(500),
        new_value TEXT,
        old_value TEXT,
        primary key (id)
    );

    create table discussions (
        deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        created_by_member_id uuid not null,
        event_id uuid,
        id uuid not null,
        team_id uuid,
        updated_by uuid,
        scope varchar(40) not null check (scope in ('GLOBAL','TEAM','EVENT')),
        title varchar(300) not null,
        primary key (id)
    );

    create table document_versions (
        version_number integer not null,
        uploaded_at timestamp(6) with time zone not null,
        document_id uuid not null,
        id uuid not null,
        uploaded_by uuid,
        file_path varchar(255) not null,
        original_file_name varchar(255),
        primary key (id)
    );

    create table documents (
        deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        size_bytes bigint,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        related_event_id uuid,
        updated_by uuid,
        category varchar(40) not null check (category in ('FUNDING_REQUEST','PROGRAM','CERTIFICATE','REPORT','ADMINISTRATIVE','AGREEMENT','MEETING_MINUTES','PUBLICATION','OTHER')),
        title varchar(300) not null,
        tags varchar(500),
        content_type varchar(255),
        file_path varchar(255) not null,
        original_file_name varchar(255),
        primary key (id)
    );

    create table equipment (
        arrival_date date,
        available_quantity integer not null,
        deleted boolean not null,
        quantity integer not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        updated_by uuid,
        category varchar(100),
        description TEXT,
        name varchar(255) not null,
        primary key (id)
    );

    create table equipment_distributions (
        distribution_date date not null,
        quantity integer not null,
        returned_date date,
        equipment_id uuid not null,
        id uuid not null,
        member_id uuid not null,
        primary key (id)
    );

    create table equipment_requests (
        deleted boolean not null,
        quantity integer not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        validation_date timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        requester_id uuid not null,
        updated_by uuid,
        validated_by uuid,
        status varchar(40) not null check (status in ('PENDING','APPROVED','REJECTED','FULFILLED')),
        validation_note varchar(1000),
        description TEXT,
        item_name varchar(255) not null,
        primary key (id)
    );

    create table event_organizers (
        event_id uuid not null,
        id uuid not null,
        member_id uuid not null,
        primary key (id)
    );

    create table event_participants (
        registered_at timestamp(6) with time zone not null,
        event_id uuid not null,
        id uuid not null,
        member_id uuid not null,
        primary key (id)
    );

    create table events (
        deleted boolean not null,
        edition_number integer,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        end_date timestamp(6) not null,
        start_date timestamp(6) not null,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        updated_by uuid,
        type varchar(40) not null check (type in ('CONFERENCE','WORKSHOP','SEMINAR')),
        title varchar(300) not null,
        banner_image_path varchar(255),
        description TEXT,
        location varchar(255),
        primary key (id)
    );

    create table mandates (
        active boolean not null,
        end_date date,
        start_date date not null,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        member_id uuid not null,
        team_id uuid,
        role varchar(40) not null check (role in ('DIRECTOR','VICE_DIRECTOR','TEAM_LEADER')),
        primary key (id)
    );

    create table meeting_minutes (
        uploaded_at timestamp(6) with time zone not null,
        id uuid not null,
        meeting_id uuid not null,
        uploaded_by uuid,
        file_path varchar(255) not null,
        original_file_name varchar(255),
        primary key (id)
    );

    create table meetings (
        deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        meeting_date timestamp(6) not null,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        updated_by uuid,
        type varchar(100),
        title varchar(300) not null,
        agenda TEXT,
        location varchar(255),
        primary key (id)
    );

    create table member_status_history (
        end_date date,
        start_date date not null,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        member_id uuid not null,
        status varchar(40) not null check (status in ('PERMANENT','ASSOCIATE','PHD_STUDENT','RETIRED','FORMER')),
        reason varchar(500),
        primary key (id)
    );

    create table members (
        birth_date date,
        deleted boolean not null,
        first_affiliation_date date,
        hire_date date,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        current_team_id uuid,
        id uuid not null,
        updated_by uuid,
        user_id uuid unique,
        current_status varchar(40) not null check (current_status in ('PERMANENT','ASSOCIATE','PHD_STUDENT','RETIRED','FORMER')),
        first_name varchar(100) not null,
        last_name varchar(100) not null,
        email varchar(190) not null,
        biography TEXT,
        home_institution varchar(255),
        home_laboratory varchar(255),
        photo_url varchar(255),
        research_interests TEXT,
        primary key (id)
    );

    create table membership_requests (
        deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        decision_date timestamp(6) with time zone,
        deleted_at timestamp(6) with time zone,
        submitted_at timestamp(6) with time zone not null,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        decided_by uuid,
        id uuid not null,
        updated_by uuid,
        requested_status varchar(40) not null check (requested_status in ('PERMANENT','ASSOCIATE','PHD_STUDENT','RETIRED','FORMER')),
        status varchar(40) not null check (status in ('PENDING','APPROVED','REJECTED')),
        first_name varchar(100) not null,
        last_name varchar(100) not null,
        email varchar(190) not null,
        decision_note varchar(1000),
        cv_original_name varchar(255),
        cv_path varchar(255),
        home_institution varchar(255),
        motivation_letter TEXT,
        primary key (id)
    );

    create table messages (
        timestamp timestamp(6) with time zone not null,
        discussion_id uuid not null,
        id uuid not null,
        sender_id uuid not null,
        content TEXT not null,
        primary key (id)
    );

    create table notifications (
        deleted boolean not null,
        is_read boolean not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        recipient_id uuid not null,
        related_entity_id uuid,
        updated_by uuid,
        type varchar(40) not null check (type in ('MEMBERSHIP_REQUEST','MEMBERSHIP_DECISION','DOCUMENT_ADDED','EVENT_CREATED','EVENT_REMINDER','PUBLICATION_ADDED','EQUIPMENT_REQUEST','EQUIPMENT_REQUEST_DECISION','MEETING_SCHEDULED','MESSAGE_RECEIVED','SYSTEM')),
        related_entity_type varchar(100),
        message varchar(1000) not null,
        primary key (id)
    );

    create table partners (
        deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        updated_by uuid,
        country varchar(100),
        type varchar(100),
        contact_info TEXT,
        logo_path varchar(255),
        name varchar(255) not null,
        primary key (id)
    );

    create table password_reset_tokens (
        used boolean not null,
        created_at timestamp(6) with time zone not null,
        expires_at timestamp(6) with time zone not null,
        id uuid not null,
        user_id uuid not null,
        token varchar(190) not null unique,
        primary key (id)
    );

    create table publication_authors (
        author_order integer,
        id uuid not null,
        member_id uuid not null,
        publication_id uuid not null,
        primary key (id)
    );

    create table publications (
        deleted boolean not null,
        year integer not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        team_id uuid,
        updated_by uuid,
        doi varchar(190),
        keywords varchar(500),
        title varchar(500) not null,
        abstract_text TEXT,
        pdf_original_name varchar(255),
        pdf_path varchar(255),
        primary key (id)
    );

    create table team_membership_history (
        end_date date,
        start_date date not null,
        created_at timestamp(6) with time zone not null,
        id uuid not null,
        member_id uuid not null,
        team_id uuid not null,
        primary key (id)
    );

    create table teams (
        creation_date date,
        deleted boolean not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        updated_by uuid,
        name varchar(190) not null unique,
        description TEXT,
        primary key (id)
    );

    create table users (
        deleted boolean not null,
        enabled boolean not null,
        failed_login_attempts integer not null,
        must_change_password boolean not null,
        created_at timestamp(6) with time zone not null,
        deleted_at timestamp(6) with time zone,
        last_login_at timestamp(6) with time zone,
        updated_at timestamp(6) with time zone,
        version bigint not null,
        created_by uuid,
        id uuid not null,
        updated_by uuid,
        role varchar(40) not null check (role in ('SYSTEM_ADMIN','DIRECTOR','VICE_DIRECTOR','TEAM_LEADER','PERMANENT_MEMBER','ASSOCIATE_MEMBER','PHD_STUDENT','RETIRED_MEMBER','FORMER_MEMBER')),
        email varchar(190) not null unique,
        password_hash varchar(255) not null,
        primary key (id)
    );

    create index idx_affiliation_member 
       on affiliation_history (member_id);

    create index idx_agreements_partner 
       on agreements (partner_id);

    create index idx_audit_actor 
       on audit_logs (actor_id);

    create index idx_audit_entity 
       on audit_logs (entity_type, entity_id);

    create index idx_audit_created_at 
       on audit_logs (created_at);

    create index idx_discussions_team 
       on discussions (team_id);

    create index idx_discussions_event 
       on discussions (event_id);

    create index idx_document_versions_document 
       on document_versions (document_id);

    create index idx_documents_category 
       on documents (category);

    create index idx_documents_related_event 
       on documents (related_event_id);

    create index idx_equipment_category 
       on equipment (category);

    create index idx_equipment_distributions_equipment 
       on equipment_distributions (equipment_id);

    create index idx_equipment_distributions_member 
       on equipment_distributions (member_id);

    create index idx_equipment_requests_status 
       on equipment_requests (status);

    create index idx_equipment_requests_requester 
       on equipment_requests (requester_id);

    create index idx_event_organizers_event 
       on event_organizers (event_id);

    create index idx_event_organizers_member 
       on event_organizers (member_id);

    create index idx_event_participants_event 
       on event_participants (event_id);

    create index idx_event_participants_member 
       on event_participants (member_id);

    create index idx_events_type 
       on events (type);

    create index idx_events_start_date 
       on events (start_date);

    create index idx_mandates_member 
       on mandates (member_id);

    create index idx_mandates_team 
       on mandates (team_id);

    create index idx_mandates_role 
       on mandates (role);

    create index idx_meeting_minutes_meeting 
       on meeting_minutes (meeting_id);

    create index idx_meetings_date 
       on meetings (meeting_date);

    create index idx_status_history_member 
       on member_status_history (member_id);

    create index idx_members_last_name 
       on members (last_name);

    create index idx_members_status 
       on members (current_status);

    create index idx_members_team 
       on members (current_team_id);

    create index idx_membership_requests_status 
       on membership_requests (status);

    create index idx_membership_requests_email 
       on membership_requests (email);

    create index idx_messages_discussion 
       on messages (discussion_id);

    create index idx_notifications_recipient 
       on notifications (recipient_id);

    create index idx_notifications_read 
       on notifications (is_read);

    create index idx_partners_country 
       on partners (country);

    create index idx_pub_authors_publication 
       on publication_authors (publication_id);

    create index idx_pub_authors_member 
       on publication_authors (member_id);

    create index idx_publications_year 
       on publications (year);

    create index idx_publications_team 
       on publications (team_id);

    create index idx_publications_doi 
       on publications (doi);

    create index idx_team_membership_member 
       on team_membership_history (member_id);

    create index idx_team_membership_team 
       on team_membership_history (team_id);

    create index idx_teams_name 
       on teams (name);

    alter table if exists affiliation_history 
       add constraint FKc6qc8c43alxll0ljy0i3onlr0 
       foreign key (member_id) 
       references members;

    alter table if exists agreements 
       add constraint FKg2p84ug8oalga9art7rvpi271 
       foreign key (partner_id) 
       references partners;

    alter table if exists discussions 
       add constraint FK17ma8ntax4j35yt64ph95l6dv 
       foreign key (created_by_member_id) 
       references members;

    alter table if exists discussions 
       add constraint FKo5q4wgr57vispo7r54mfatilb 
       foreign key (event_id) 
       references events;

    alter table if exists discussions 
       add constraint FKn17e3fk6mbxnpfm7prpetl6pp 
       foreign key (team_id) 
       references teams;

    alter table if exists document_versions 
       add constraint FKi6p7dgv96b8s8ivf84hqo9pt 
       foreign key (document_id) 
       references documents;

    alter table if exists equipment_distributions 
       add constraint FKnv1w1v7udohqub2vlfq0seehb 
       foreign key (equipment_id) 
       references equipment;

    alter table if exists equipment_distributions 
       add constraint FKaqwomngba23gkffpux1c12bj6 
       foreign key (member_id) 
       references members;

    alter table if exists equipment_requests 
       add constraint FK1u3c8pmt3tktyv110u3m38io8 
       foreign key (requester_id) 
       references members;

    alter table if exists event_organizers 
       add constraint FK16stg4khqay3j62bjnxp8rgdb 
       foreign key (event_id) 
       references events;

    alter table if exists event_organizers 
       add constraint FK1qnrcskbh02pc5natq6qabfvl 
       foreign key (member_id) 
       references members;

    alter table if exists event_participants 
       add constraint FK2x391urx4up03f4jp2y9mdt5x 
       foreign key (event_id) 
       references events;

    alter table if exists event_participants 
       add constraint FKlxm6u37f7db4nbggou6y2fubc 
       foreign key (member_id) 
       references members;

    alter table if exists mandates 
       add constraint FKehapbarscvlw8nl5weoxcfyqu 
       foreign key (member_id) 
       references members;

    alter table if exists mandates 
       add constraint FKdgx3j6mvrwyx56ax71ycuqxn3 
       foreign key (team_id) 
       references teams;

    alter table if exists meeting_minutes 
       add constraint FK2kaic07c9fhvg2r6u5asq8vr8 
       foreign key (meeting_id) 
       references meetings;

    alter table if exists member_status_history 
       add constraint FKr3d6xmnldkeru5s0o0hwu1kbj 
       foreign key (member_id) 
       references members;

    alter table if exists members 
       add constraint FKgmaufj8gb13sa7l1en1bghfey 
       foreign key (current_team_id) 
       references teams;

    alter table if exists members 
       add constraint FKpj3n6wh5muoeakc485whgs3x5 
       foreign key (user_id) 
       references users;

    alter table if exists messages 
       add constraint FKkjpfcbwaxw5ybq3sfcbwvkua2 
       foreign key (discussion_id) 
       references discussions;

    alter table if exists messages 
       add constraint FKmd3q6fmua1eggp8jvpdx4ook9 
       foreign key (sender_id) 
       references members;

    alter table if exists notifications 
       add constraint FKqu0hchk409ykhv450y9vkp7h8 
       foreign key (recipient_id) 
       references members;

    alter table if exists password_reset_tokens 
       add constraint FKk3ndxg5xp6v7wd4gjyusp15gq 
       foreign key (user_id) 
       references users;

    alter table if exists publication_authors 
       add constraint FKgv53jj3rgwd109c58hjou30ro 
       foreign key (member_id) 
       references members;

    alter table if exists publication_authors 
       add constraint FKftt1b9a40c6clsurl0yki0ac7 
       foreign key (publication_id) 
       references publications;

    alter table if exists publications 
       add constraint FKbbsxnmpt30rg6k2d8r0emg1o6 
       foreign key (team_id) 
       references teams;

    alter table if exists team_membership_history 
       add constraint FKjcj3jp0vmbgmtrql1w6qvw8df 
       foreign key (member_id) 
       references members;

    alter table if exists team_membership_history 
       add constraint FKq5upkbdvvt0tavbyp8i00cvae 
       foreign key (team_id) 
       references teams;

