// boot.js
(() => {
    const STATES = {
        routeMode: ['seek', 'look'],
        routeBase: ['ascend', 'rebase'],
        renderMode: ['look', 'seek'],
        renderBase: ['ascend', 'rebase'],
    };

    const boolClass = (step, name, enabled) => {
        step.classList.toggle(`has-${name}`, enabled);
        step.classList.toggle(`no-${name}`, !enabled);
    };

    const enumClass = (step, prefix, value, allowed) => {
        allowed.forEach(option => {
            step.classList.remove(`is-${prefix}-${option}`);
        });
        if (value) step.classList.add(`is-${prefix}-${value}`);
    };

    const checkedValue = (step, name) => {
        const input = step.querySelector(`input[name="${name}"]:checked`);
        return input ? input.value : null;
    };

    const setChecked = (step, name, value) => {
        const input = step.querySelector(`input[name="${name}"][value="${value}"]`);
        if (input) input.checked = true;
    };

    const syncModeBaseRules = (step, phase) => {
        const mode = checkedValue(step, `${phase}-mode`);
        const baseRow = step.querySelector(`[data-base-group="${phase}"]`);
        const ascend = step.querySelector(`input[name="${phase}-base"][value="ascend"]`);
        const rebase = step.querySelector(`input[name="${phase}-base"][value="rebase"]`);

        if (!baseRow || !ascend || !rebase) return;

        baseRow.classList.remove('is-disabled');

        if (mode === 'look') {
            ascend.disabled = true;
            rebase.disabled = false;

            const ascendLabel = ascend.closest('label');
            const rebaseLabel = rebase.closest('label');

            if (ascendLabel) ascendLabel.classList.add('is-disabled');
            if (rebaseLabel) rebaseLabel.classList.remove('is-disabled');

            if (ascend.checked) {
                rebase.checked = true;
            }
        } else {
            ascend.disabled = false;
            rebase.disabled = false;

            const ascendLabel = ascend.closest('label');
            const rebaseLabel = rebase.closest('label');

            if (ascendLabel) ascendLabel.classList.remove('is-disabled');
            if (rebaseLabel) rebaseLabel.classList.remove('is-disabled');

            if (!ascend.checked && !rebase.checked) {
                setChecked(step, `${phase}-base`, 'ascend');
            }
        }
    };

    const syncDependencies = step => {
        const pdo = step.querySelector('input[name="pdo"]');
        const auth = step.querySelector('input[name="auth"]');

        if (pdo && auth) {
            auth.disabled = !pdo.checked;

            const authLabel = auth.closest('label');
            if (authLabel) authLabel.classList.toggle('is-disabled', !pdo.checked);

            if (!pdo.checked) {
                auth.checked = false;
            }
        }

        syncModeBaseRules(step, 'route');
        syncModeBaseRules(step, 'render');
    };

    const syncRebaseUsage = step => {
        const routeBase = checkedValue(step, 'route-base');
        const renderBase = checkedValue(step, 'render-base');

        const needsRebase =
            routeBase === 'rebase' ||
            renderBase === 'rebase';

        step.classList.toggle('needs-map-rebase', needsRebase);
        step.classList.toggle('no-map-rebase', !needsRebase);
    };

    const syncStep = step => {
        syncDependencies(step);

        boolClass(step, 'trap', !!step.querySelector('input[name="trap"]')?.checked);
        boolClass(step, 'http', !!step.querySelector('input[name="http"]')?.checked);
        boolClass(step, 'pdo', !!step.querySelector('input[name="pdo"]')?.checked);
        boolClass(step, 'auth', !!step.querySelector('input[name="auth"]')?.checked);
        boolClass(step, 'csrf', !!step.querySelector('input[name="csrf"]')?.checked);

        enumClass(step, 'route-mode', checkedValue(step, 'route-mode'), STATES.routeMode);
        enumClass(step, 'route-base', checkedValue(step, 'route-base'), STATES.routeBase);
        enumClass(step, 'render-mode', checkedValue(step, 'render-mode'), STATES.renderMode);
        enumClass(step, 'render-base', checkedValue(step, 'render-base'), STATES.renderBase);

        syncRebaseUsage(step);
    };

    const initStep = step => {
        step.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => syncStep(step));
        });

        syncStep(step);
    };

    document.querySelectorAll('[data-boot-step]').forEach(initStep);
})();