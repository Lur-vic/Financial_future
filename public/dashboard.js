// public/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('projectionsBody');
    const authMessage = document.getElementById('authMessage');
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    // Бургер-меню
    menuToggle?.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });

    // Проверяем авторизацию
    const res = await fetch('/auth/me');
    const data = await res.json();

    if (!data.authenticated) {
        authMessage.textContent = 'You must be logged in to view Dashboard.';
        tableBody.innerHTML = '';
        return;
    }

    // Получаем все расчёты текущего пользователя
    try {
        const response = await fetch('/api/user-projections');
        const projections = await response.json();

        if (!response.ok) throw new Error(projections.error || 'Failed to load');

        if (projections.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">
                No projections yet. Go create your first one!
            </td></tr>`;
            return;
        }

        // Сортируем по дате (новые сверху)
        projections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        tableBody.innerHTML = projections.map(p => {
            const date = new Date(p.created_at).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '');

            return `
                <tr>
                    <td>${date}</td>
                    <td>$${Number(p.active_monthly).toLocaleString()}</td>
                    <td>$${Number(p.regular_monthly).toLocaleString()}</td>
                    <td>$${Number(p.additional_yearly_spending).toLocaleString()}</td>
                    <td>$${Number(p.current_assets).toLocaleString()}</td>
                    <td>${p.projection_years} yrs</td>
                    <td style="color: var(--accent-green); font-weight: bold;">
                        $${Number(p.result_investing_amount).toLocaleString()}
                    </td>
                    <td style="color: var(--accent-blue);">
                        $${Number(p.result_saving_amount).toLocaleString()}
                    </td>
                    <td>
                        <button class="view-btn" data-id="${p.id}">View</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Клик по "View" — можно потом открыть модалку с полными данными
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                alert(`In the future here will be a modal with full data for projection #${id}`);
                // Позже сделаем красивую модалку
            });
        });

    } catch (err) {
        authMessage.textContent = 'Error loading projections: ' + err.message;
        console.error(err);
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}