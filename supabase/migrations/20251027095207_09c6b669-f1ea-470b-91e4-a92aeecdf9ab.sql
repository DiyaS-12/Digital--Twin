-- Update psoni@bimboss.com to manager role
DELETE FROM public.user_roles WHERE user_id = '3cc5e16e-cd5a-4520-ab8a-d7dae521f1f3';
INSERT INTO public.user_roles (user_id, role) VALUES ('3cc5e16e-cd5a-4520-ab8a-d7dae521f1f3', 'manager');

-- Update diya.sanghvi1@gendes.in to editor role
DELETE FROM public.user_roles WHERE user_id = '9c90c7b2-1579-488d-a9dd-c59353d0fdcf';
INSERT INTO public.user_roles (user_id, role) VALUES ('9c90c7b2-1579-488d-a9dd-c59353d0fdcf', 'editor');