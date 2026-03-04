// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FreightFlow — Sistema de Agendamento de Frete
// JavaScript para interações, validações e integrações com API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ──────────────────────────────────────────────────────────────────────────
// Configuração
// ──────────────────────────────────────────────────────────────────────────

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Estado do formulário
let currentStep = 1;
let itemCount = 1;
let formData = {};

// ──────────────────────────────────────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFormMasks();
    initAnimations();
    setMinDate();
});

function initNavigation() {
    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section[id]');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// ──────────────────────────────────────────────────────────────────────────
// Form Masks
// ──────────────────────────────────────────────────────────────────────────

function initFormMasks() {
    // CPF mask
    const cpfInput = document.getElementById('requester_cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            }
        });
    }

    // Phone mask
    const phoneInput = document.getElementById('requester_phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            }
        });
    }

    // CEP mask
    const cepInputs = ['pickup_zipcode', 'delivery_zipcode'];
    cepInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 8) {
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                    e.target.value = value;
                }
            });
        }
    });
}

function setMinDate() {
    const dateInput = document.getElementById('scheduled_date');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        dateInput.setAttribute('min', minDate);
    }
}

// ──────────────────────────────────────────────────────────────────────────
// Multi-step Form
// ──────────────────────────────────────────────────────────────────────────

function nextStep() {
    if (validateStep(currentStep)) {
        hideStep(currentStep);
        currentStep++;
        showStep(currentStep);
        updateStepIndicator();

        if (currentStep === 4) {
            populateConfirmation();
        }
    }
}

function prevStep() {
    hideStep(currentStep);
    currentStep--;
    showStep(currentStep);
    updateStepIndicator();
}

function showStep(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
}

function hideStep(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    if (stepElement) {
        stepElement.classList.remove('active');
    }
}

function updateStepIndicator() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        }
    });
}

function validateStep(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!stepElement) return false;

    const inputs = stepElement.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#EF4444';
            isValid = false;

            setTimeout(() => {
                input.style.borderColor = '';
            }, 2000);
        }
    });

    if (!isValid) {
        alert('Por favor, preencha todos os campos obrigatórios.');
    }

    return isValid;
}

// ──────────────────────────────────────────────────────────────────────────
// Items Management
// ──────────────────────────────────────────────────────────────────────────

function addItem() {
    itemCount++;
    const itemsList = document.getElementById('itemsList');
    
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.setAttribute('data-item', itemCount - 1);
    
    itemCard.innerHTML = `
        <div class="item-header">
            <span class="item-number">Item #${itemCount}</span>
            <button type="button" class="btn-icon" onclick="removeItem(${itemCount - 1})">
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
        <div class="form-grid">
            <div class="form-group span-2">
                <label class="form-label">Descrição</label>
                <input type="text" class="form-input item-description" required>
            </div>
            <div class="form-group">
                <label class="form-label">Quantidade</label>
                <input type="number" class="form-input item-quantity" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label class="form-label">Peso (kg)</label>
                <input type="number" class="form-input item-weight" step="0.01" min="0.01" required>
            </div>
            <div class="form-group">
                <label class="form-label">Comprimento (cm)</label>
                <input type="number" class="form-input item-length" step="0.1" min="0.1" required>
            </div>
            <div class="form-group">
                <label class="form-label">Largura (cm)</label>
                <input type="number" class="form-input item-width" step="0.1" min="0.1" required>
            </div>
            <div class="form-group">
                <label class="form-label">Altura (cm)</label>
                <input type="number" class="form-input item-height" step="0.1" min="0.1" required>
            </div>
            <div class="form-group">
                <label class="form-label">Valor Declarado (R$)</label>
                <input type="number" class="form-input item-value" step="0.01" min="0" required>
            </div>
            <div class="form-group span-2">
                <label class="checkbox-label">
                    <input type="checkbox" class="item-fragile">
                    <span>Item frágil</span>
                </label>
            </div>
            <div class="form-group span-3">
                <label class="form-label">Observações</label>
                <textarea class="form-input item-notes" rows="2"></textarea>
            </div>
        </div>
    `;
    
    itemsList.appendChild(itemCard);
}

function removeItem(index) {
    const itemCard = document.querySelector(`.item-card[data-item="${index}"]`);
    if (itemCard) {
        itemCard.remove();
        itemCount--;
        updateItemNumbers();
    }
}

function updateItemNumbers() {
    const itemCards = document.querySelectorAll('.item-card');
    itemCards.forEach((card, index) => {
        card.setAttribute('data-item', index);
        const numberSpan = card.querySelector('.item-number');
        if (numberSpan) {
            numberSpan.textContent = `Item #${index + 1}`;
        }
        const removeBtn = card.querySelector('.btn-icon');
        if (removeBtn) {
            removeBtn.setAttribute('onclick', `removeItem(${index})`);
        }
    });
}

// ──────────────────────────────────────────────────────────────────────────
// Confirmation
// ──────────────────────────────────────────────────────────────────────────

function populateConfirmation() {
    // Requester info
    const requesterHTML = `
        <div class="confirmation-item">
            <span class="confirmation-label">Nome:</span>
            <span>${document.getElementById('requester_name').value}</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">CPF:</span>
            <span>${document.getElementById('requester_cpf').value}</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">Telefone:</span>
            <span>${document.getElementById('requester_phone').value}</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">E-mail:</span>
            <span>${document.getElementById('requester_email').value}</span>
        </div>
    `;
    document.getElementById('confirmRequester').innerHTML = requesterHTML;

    // Addresses
    const pickupAddress = formatAddress('pickup');
    const deliveryAddress = formatAddress('delivery');
    const addressesHTML = `
        <div style="margin-bottom: 1.5rem;">
            <strong style="color: var(--primary);">📍 Coleta:</strong><br>
            ${pickupAddress}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong style="color: var(--primary);">🎯 Entrega:</strong><br>
            ${deliveryAddress}
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">Data de Coleta:</span>
            <span>${formatDate(document.getElementById('scheduled_date').value)}</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">Modalidade:</span>
            <span>${document.getElementById('modality').selectedOptions[0].text}</span>
        </div>
    `;
    document.getElementById('confirmAddresses').innerHTML = addressesHTML;

    // Items
    const items = collectItemsData();
    let itemsHTML = '';
    items.forEach((item, index) => {
        itemsHTML += `
            <div style="padding: 1rem; background: var(--bg); border-radius: 8px; margin-bottom: 1rem;">
                <strong>Item ${index + 1}: ${item.description}</strong><br>
                <span style="font-size: 0.875rem; color: var(--gray);">
                    ${item.quantity}× • ${item.weight_kg} kg • 
                    ${item.length_cm}×${item.width_cm}×${item.height_cm} cm • 
                    R$ ${item.declared_value}
                    ${item.fragile ? ' • <span style="color: var(--primary);">⚠️ Frágil</span>' : ''}
                </span>
            </div>
        `;
    });
    document.getElementById('confirmItems').innerHTML = itemsHTML;

    // Summary
    const totalWeight = items.reduce((sum, item) => sum + parseFloat(item.weight_kg) * parseInt(item.quantity), 0);
    const totalValue = items.reduce((sum, item) => sum + parseFloat(item.declared_value) * parseInt(item.quantity), 0);
    const summaryHTML = `
        <div class="confirmation-item">
            <span class="confirmation-label">Total de Itens:</span>
            <span>${items.reduce((sum, item) => sum + parseInt(item.quantity), 0)} unidades</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">Peso Total:</span>
            <span>${totalWeight.toFixed(2)} kg</span>
        </div>
        <div class="confirmation-item">
            <span class="confirmation-label">Valor Total Declarado:</span>
            <span>R$ ${totalValue.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('confirmSummary').innerHTML = summaryHTML;
}

function formatAddress(type) {
    const street = document.getElementById(`${type}_street`).value;
    const number = document.getElementById(`${type}_number`).value;
    const complement = document.getElementById(`${type}_complement`).value;
    const neighborhood = document.getElementById(`${type}_neighborhood`).value;
    const city = document.getElementById(`${type}_city`).value;
    const state = document.getElementById(`${type}_state`).value;
    const zipcode = document.getElementById(`${type}_zipcode`).value;

    let address = `${street}, ${number}`;
    if (complement) address += `, ${complement}`;
    address += `<br>${neighborhood} - ${city}/${state}<br>CEP ${zipcode}`;
    
    return address;
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

// ──────────────────────────────────────────────────────────────────────────
// Form Submission
// ──────────────────────────────────────────────────────────────────────────

document.getElementById('freightForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        requester: {
            cpf: document.getElementById('requester_cpf').value.replace(/\D/g, ''),
            name: document.getElementById('requester_name').value,
            phone: document.getElementById('requester_phone').value,
            email: document.getElementById('requester_email').value,
        },
        pickup_address: {
            street: document.getElementById('pickup_street').value,
            number: document.getElementById('pickup_number').value,
            complement: document.getElementById('pickup_complement').value,
            neighborhood: document.getElementById('pickup_neighborhood').value,
            city: document.getElementById('pickup_city').value,
            state: document.getElementById('pickup_state').value.toUpperCase(),
            zip_code: document.getElementById('pickup_zipcode').value.replace(/\D/g, ''),
        },
        delivery_address: {
            street: document.getElementById('delivery_street').value,
            number: document.getElementById('delivery_number').value,
            complement: document.getElementById('delivery_complement').value,
            neighborhood: document.getElementById('delivery_neighborhood').value,
            city: document.getElementById('delivery_city').value,
            state: document.getElementById('delivery_state').value.toUpperCase(),
            zip_code: document.getElementById('delivery_zipcode').value.replace(/\D/g, ''),
        },
        scheduled_date: document.getElementById('scheduled_date').value,
        modality: document.getElementById('modality').value,
        items: collectItemsData(),
        notes: document.getElementById('notes').value,
    };

    try {
        // Simulação de chamada à API (sem backend real neste momento)
        console.log('Dados enviados:', data);
        
        // Simular resposta da API
        const response = await simulateAPICall(data);
        
        // Mostrar modal de sucesso
        showSuccessModal(response.freight_id);
        
        // Reset form
        resetForm();
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        alert('Erro ao processar agendamento. Tente novamente.');
    }
});

function collectItemsData() {
    const items = [];
    const itemCards = document.querySelectorAll('.item-card');
    
    itemCards.forEach(card => {
        items.push({
            description: card.querySelector('.item-description').value,
            quantity: parseInt(card.querySelector('.item-quantity').value),
            weight_kg: parseFloat(card.querySelector('.item-weight').value),
            length_cm: parseFloat(card.querySelector('.item-length').value),
            width_cm: parseFloat(card.querySelector('.item-width').value),
            height_cm: parseFloat(card.querySelector('.item-height').value),
            declared_value: parseFloat(card.querySelector('.item-value').value),
            fragile: card.querySelector('.item-fragile').checked,
            notes: card.querySelector('.item-notes').value,
        });
    });
    
    return items;
}

async function simulateAPICall(data) {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retorna ID simulado
    return {
        freight_id: generateUUID(),
        status: 'DRAFT',
        created_at: new Date().toISOString(),
    };
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ──────────────────────────────────────────────────────────────────────────
// Modal
// ──────────────────────────────────────────────────────────────────────────

function showSuccessModal(freightId) {
    document.getElementById('modalFreightId').textContent = freightId;
    document.getElementById('successModal').classList.add('active');
}

function closeModal() {
    document.getElementById('successModal').classList.remove('active');
}

function resetForm() {
    document.getElementById('freightForm').reset();
    currentStep = 1;
    itemCount = 1;
    
    // Reset item cards to just one
    const itemsList = document.getElementById('itemsList');
    const itemCards = itemsList.querySelectorAll('.item-card');
    itemCards.forEach((card, index) => {
        if (index > 0) card.remove();
    });
    
    showStep(1);
    updateStepIndicator();
}

// ──────────────────────────────────────────────────────────────────────────
// Tracking
// ──────────────────────────────────────────────────────────────────────────

async function trackFreight() {
    const trackingId = document.getElementById('trackingId').value.trim();
    
    if (!trackingId) {
        alert('Por favor, insira um ID de agendamento.');
        return;
    }

    try {
        // Simulação de busca (sem backend real)
        const freight = await simulateTrackingAPI(trackingId);
        displayTrackingResult(freight);
    } catch (error) {
        alert('Agendamento não encontrado.');
        document.getElementById('trackingResult').style.display = 'none';
    }
}

async function simulateTrackingAPI(id) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Dados simulados
    const statuses = ['DRAFT', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
        freight_id: id,
        status: randomStatus,
        scheduled_date: '2026-03-05',
        requester_name: 'João da Silva',
        pickup_city: 'São Paulo',
        pickup_state: 'SP',
        delivery_city: 'Rio de Janeiro',
        delivery_state: 'RJ',
        item_count: 3,
    };
}

function displayTrackingResult(freight) {
    document.getElementById('resultId').textContent = freight.freight_id;
    document.getElementById('resultDate').textContent = formatDate(freight.scheduled_date);
    document.getElementById('resultRequester').textContent = freight.requester_name;
    document.getElementById('resultOrigin').textContent = `${freight.pickup_city}/${freight.pickup_state}`;
    document.getElementById('resultDestination').textContent = `${freight.delivery_city}/${freight.delivery_state}`;
    document.getElementById('resultItems').textContent = `${freight.item_count} itens`;
    
    // Status badge
    const statusBadge = document.getElementById('resultStatus');
    statusBadge.textContent = getStatusLabel(freight.status);
    statusBadge.className = `status-badge ${freight.status.toLowerCase()}`;
    
    // Timeline
    const statusOrder = ['DRAFT', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(freight.status);
    
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        if (index <= currentIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    document.getElementById('trackingResult').style.display = 'block';
    document.getElementById('trackingResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getStatusLabel(status) {
    const labels = {
        'DRAFT': 'Rascunho',
        'CONFIRMED': 'Confirmado',
        'ASSIGNED': 'Designado',
        'IN_TRANSIT': 'Em Trânsito',
        'DELIVERED': 'Entregue',
        'CANCELLED': 'Cancelado',
    };
    return labels[status] || status;
}

// ──────────────────────────────────────────────────────────────────────────
// Animations
// ──────────────────────────────────────────────────────────────────────────

function initAnimations() {
    // Counter animation for hero stats
    const observerOptions = {
        threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    animateCounter(counter);
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}