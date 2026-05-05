CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE public.cf_admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL
);

CREATE TABLE public.cf_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.cf_post_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    image_url text NOT NULL,
    image_order integer DEFAULT 0 NOT NULL,
    is_cover boolean DEFAULT false NOT NULL,
    thumb_url text
);

ALTER TABLE ONLY public.cf_admins
    ADD CONSTRAINT cf_admins_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cf_admins
    ADD CONSTRAINT cf_admins_username_key UNIQUE (username);

ALTER TABLE ONLY public.cf_posts
    ADD CONSTRAINT cf_posts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cf_post_images
    ADD CONSTRAINT cf_post_images_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cf_post_images
    ADD CONSTRAINT cf_post_images_post_id_fkey
    FOREIGN KEY (post_id)
    REFERENCES public.cf_posts(id)
    ON DELETE CASCADE;
