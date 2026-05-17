class RestaurantBookingSystem {
    constructor() {
        this.bookings = JSON.parse(localStorage.getItem('deliziaBookings')) || [];
        this.tables = [
            { id: 1, name: 'Table 1', capacity: 2, type: 'window', status: 'available' },
            { id: 2, name: 'Table 2', capacity: 4, type: 'private', status: 'available' },
            { id: 3, name: 'Table 3', capacity: 2, type: 'bar', status: 'available' },
            { id: 4, name: 'Table 4', capacity: 6, type: 'window', status: 'booked' },
            { id: 5, name: 'Table 5', capacity: 4, type: 'private', status: 'available' },
            { id: 6, name: 'Table 6', capacity: 2, type: 'bar', status: 'available' },
            { id: 7, name: 'Table 7', capacity: 4, type: 'window', status: 'available' },
            { id: 8, name: 'Table 8', capacity: 2, type: 'private', status: 'booked' },
            { id: 9, name: 'Table 9', capacity: 6, type: 'window', status: 'available' },
            { id: 10, name: 'Table 10', capacity: 4, type: 'bar', status: 'available' },
            { id: 11, name: 'Table 11', capacity: 2, type: 'private', status: 'available' },
            { id: 12, name: 'Table 12', capacity: 4, type: 'window', status: 'available' }
        ];
        this.timeSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
        this.nextBookingId = this.bookings.length > 0 ? Math.max(...this.bookings.map(b => b.id)) + 1 : 1;
        this.init();
    }

    init() {
        this.initDatePicker();
        this.renderTimeSlots();
        this.renderTables();
        this.renderBookings();
        this.bindEvents();
        this.updateStats();
        this.smoothScroll();
        this.observeAnimations();
    }

    initDatePicker() {
        flatpickr("#bookingDate", {
            dateFormat: "d-m-Y",
            minDate: "today",
            defaultDate: new Date().fp_incr(1),
            onChange: (selectedDates) => this.onDateChange(selectedDates[0])
        });
    }

    renderTimeSlots() {
        const container = document.getElementById('timeSlots');
        const today = new Date().toLocaleDateString('en-GB');
        container.innerHTML = this.timeSlots.map(time => {
            const isAvailable = !this.bookings.some(booking =>
                booking.date === today && booking.time === time
            );
            return `
                        <div class="time-slot ${isAvailable ? 'available' : 'unavailable'} ${isAvailable ? 'selectable' : ''}" 
                             data-time="${time}" ${isAvailable ? '' : 'disabled'}>
                            <strong>${time}</strong>
                            <small>${isAvailable ? 'Available' : 'Booked'}</small>
                        </div>
                    `;
        }).join('');
    }

    onDateChange(date) {
        const formattedDate = date.toLocaleDateString('en-GB');
        this.renderTimeSlotsForDate(formattedDate);
    }

    renderTimeSlotsForDate(date) {
        const container = document.getElementById('timeSlots');
        container.innerHTML = this.timeSlots.map(time => {
            const isAvailable = !this.bookings.some(booking =>
                booking.date === date && booking.time === time
            );
            return `
                        <div class="time-slot ${isAvailable ? 'available' : 'unavailable'} ${isAvailable ? 'selectable' : ''}" 
                             data-time="${time}" ${isAvailable ? '' : 'disabled'}>
                            <strong>${time}</strong>
                            <small>${isAvailable ? 'Available' : 'Booked'}</small>
                        </div>
                    `;
        }).join('');
    }

    bindEvents() {
        // Time slot selection
        document.getElementById('timeSlots').addEventListener('click', (e) => {
            if (e.target.closest('.selectable')) {
                document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
                e.target.closest('.time-slot').classList.add('selected');
            }
        });

        // Form submission
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBooking();
        });

        // Admin clear bookings
        document.getElementById('clearBookings').addEventListener('click', () => {
            if (confirm('Clear all bookings?')) {
                this.clearAllBookings();
            }
        });

        // Download confirmation
        document.getElementById('downloadConfirmation').addEventListener('click', () => {
            this.generatePDFConfirmation(this.lastBooking);
        });
    }

    handleBooking() {
        const formData = {
            date: document.getElementById('bookingDate').value,
            time: document.querySelector('.time-slot.selected')?.dataset.time || '',
            guests: parseInt(document.getElementById('numGuests').value),
            tablePref: document.getElementById('tablePref').value,
            name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            specialReq: document.getElementById('specialReq').value
        };

        if (!formData.time) {
            alert('Please select a time slot');
            return;
        }

        if (!formData.name || !formData.phone) {
            alert('Please fill in your name and phone number');
            return;
        }

        const booking = {
            id: this.nextBookingId++,
            date: formData.date,
            time: formData.time,
            guests: formData.guests,
            tablePref: formData.tablePref,
            name: formData.name,
            phone: formData.phone,
            specialReq: formData.specialReq,
            status: 'confirmed',
            timestamp: new Date().toISOString()
        };

        this.bookings.push(booking);
        this.saveData();
        this.lastBooking = booking;

        this.showSuccessModal(booking);
        this.renderTimeSlots();
        this.renderBookings();
        this.updateStats();
        document.getElementById('bookingForm').reset();
    }

    showSuccessModal(booking) {
        document.getElementById('bookingDetails').innerHTML = `
                    <div class="alert alert-success">
                        <strong>Booking #${booking.id}</strong><br>
                        ${booking.date} at ${booking.time}<br>
                        ${booking.guests} guests - ${booking.name}
                    </div>
                `;
        new bootstrap.Modal(document.getElementById('successModal')).show();
    }

    renderTables() {
        const container = document.getElementById('tablesContainer');
        container.innerHTML = this.tables.map(table => `
                    <div class="col-lg-4 col-md-6">
                        <div class="table-card table-status ${table.status} h-100">
                            <div class="p-4">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h4 class="fw-bold">${table.name}</h4>
                                    <span class="badge bg-${table.status === 'available' ? 'success' : 'danger'} fs-6 px-3 py-2">
                                        ${table.status.toUpperCase()}
                                    </span>
                                </div>
                                <div class="mb-3">
                                    <i class="fas fa-users me-2"></i>
                                    <strong>${table.capacity} seats</strong>
                                </div>
                                <div class="mb-4">
                                    <i class="fas fa-tag me-2"></i>
                                    <span class="badge bg-light text-dark">${table.type}</span>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar bg-${table.status === 'available' ? 'success' : 'danger'}" 
                                         style="width: ${table.status === 'available' ? '100' : '0'}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
    }

    renderBookings() {
        const container = document.getElementById('bookingsList');
        const recentBookings = this.bookings.slice(-10).reverse();

        if (recentBookings.length === 0) {
            container.innerHTML = '<div class="text-center py-5 opacity-50">No bookings yet</div>';
            return;
        }

        container.innerHTML = recentBookings.map(booking => `
                    <div class="booking-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">#${booking.id} - ${booking.name}</h6>
                                <small class="text-white-50">${booking.date} | ${booking.time} | ${booking.guests} guests</small>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${booking.status === 'confirmed' ? 'success' : 'warning'}">${booking.status.toUpperCase()}</span>
                                <br><small class="opacity-75">${booking.phone}</small>
                            </div>
                        </div>
                    </div>
                `).join('');
    }

    updateStats() {
        document.getElementById('totalBookings').textContent = this.bookings.length;
        document.getElementById('todayBookings').textContent = this.bookings.filter(b =>
            b.date === new Date().toLocaleDateString('en-GB')
        ).length;
    }

    clearAllBookings() {
        this.bookings = [];
        this.nextBookingId = 1;
        this.saveData();
        this.renderBookings();
        this.updateStats();
        this.showAlert('All bookings cleared!', 'success');
    }

    generatePDFConfirmation(booking) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(212, 165, 116);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('BOOKING CONFIRMATION', 105, 25, { align: 'center' });

        // Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        let y = 55;

        doc.setFont('helvetica', 'bold');
        doc.text(`Booking #${booking.id}`, 20, y); y += 10;
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${booking.date}`, 20, y); y += 8;
        doc.text(`Time: ${booking.time}`, 20, y); y += 8;
        doc.text(`Guests: ${booking.guests}`, 20, y); y += 8;
        doc.text(`Name: ${booking.name}`, 20, y); y += 8;
        doc.text(`Phone: ${booking.phone}`, 20, y); y += 15;

        if (booking.specialReq) {
            doc.text('Special Requests:', 20, y); y += 8;
            doc.text(booking.specialReq, 20, y, { maxWidth: 170 }); y += 15;
        }

        // Footer
        doc.setFillColor(44, 27, 20);
        doc.rect(0, 280, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Thank you for booking with Book MyTable!', 105, 292, { align: 'center' });

        doc.save(`delizia-booking-${booking.id}.pdf`);
    }

    saveData() {
        localStorage.setItem('deliziaBookings', JSON.stringify(this.bookings));
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
                    <strong>${type === 'success' ? '✓' : 'ℹ️'}</strong> ${message}
                    <button type="button" class="btn-close ms-3" data-bs-dismiss="alert"></button>
                `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    smoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector(anchor.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    }

    observeAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.table-card, .booking-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px)';
            el.style.transition = 'all 0.8s ease';
            observer.observe(el);
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RestaurantBookingSystem();
});
