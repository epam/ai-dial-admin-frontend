export const RESOURCE_DEPENDENCY_KIND = 'dial.resourceLink';

// Mirrors Core's `ResourceDependencyValidator`; Core stays authoritative and answers 400 on Save.
export const MAX_DECLARED_DEPENDENCIES = 100;

export const CURRENT_USER_PLACEHOLDER = '{current-user}';

export const DECLARABLE_TYPE_ROOTS = ['files', 'prompts', 'conversations', 'applications', 'toolsets', 'skills'];

export const PERSONAL_TARGET_FORM = `{type}/${CURRENT_USER_PLACEHOLDER}/…`;

export const COPY_LINK_ID_SUFFIX = '_copy';

export const PERSONAL_PATH_EXAMPLE = `skills/${CURRENT_USER_PLACEHOLDER}/`;

export const SHARED_PATH_EXAMPLE = 'files/public/folder/';
