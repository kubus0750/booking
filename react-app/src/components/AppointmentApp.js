import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import { Button } from '@material-ui/core';
import FlatButton from 'material-ui/FlatButton';
import moment from 'moment';
import DatePicker from 'material-ui/DatePicker';
import Dialog from 'material-ui/Dialog';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import SnackBar from 'material-ui/Snackbar';
import Card from 'material-ui/Card';
import { Step, Stepper, StepLabel, StepContent } from 'material-ui/Stepper';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import axios from 'axios';
// import { MapsTransferWithinAStation } from 'material-ui/svg-icons';

//express api
const API_BASE = 'http://localhost:5000/';

class AppointmentApp extends Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
			firstName: '',
			lastName: '',
			email: '',
			schedule: [],
			confirmationModalOpen: false,
			appointmentDateSelected: false,
			appointmentMeridiem: 0,
			finished: false,
			smallScreen: window.innerWidth < 768,
			stepIndex: 0
		};
	}
	//previous scheduled appointments slots are retrieved
	componentWillMount() {
		axios.get(API_BASE + 'slot').then(response => {
			console.log('response via db: ', response.data);
			this.handleDBReponse(response.data);
		});
	}

	//set state
	handleSetAppointmentDate(date) {
		this.setState({ appointmentDate: date, confirmationTextVisible: true });
		this.handleNext();
	}

	handleSetAppointmentSlot(slot) {
		this.setState({ appointmentSlot: slot });
	}
	handleSetAppointmentMeridiem(meridiem) {
		this.setState({ appointmentMeridiem: meridiem });
	}
	//pass user data to the database via the express app
	handleSubmit() {
		this.setState({ confirmationModalOpen: false });
		const newAppointment = {
			name: this.state.firstName + ' ' + this.state.lastName,
			email: this.state.email,
			phone: this.state.phone,
			slot_date: moment(this.state.appointmentDate).format('YYYY-DD-MM'),
			slot_time: this.state.appointmentSlot
		};
		axios
			.post(API_BASE + 'appointment', newAppointment)
			.then(response =>
				this.setState({
					confirmationSnackbarMessage: 'Appointment succesfully added!',
					confirmationSnackbarOpen: true,
					processed: true
				})
			)
			.catch(err => {
				console.log(err);
				return this.setState({
					confirmationSnackbarMessage: 'Appointment failed to save.',
					confirmationSnackbarOpen: true
				});
			});
	}
	//moves the stepper to the next postion using the stepIndex field
	handleNext = () => {
		const { stepIndex } = this.state;
		this.setState({
			stepIndex: stepIndex + 1,
			finished: stepIndex >= 2
		});
	};
	//moves the stepper to the previous postion using the stepIndex field
	handlePrev = () => {
		const { stepIndex } = this.state;
		if (stepIndex > 0) {
			this.setState({ stepIndex: stepIndex - 1 });
		}
	};
	//passes disabled dates to the date picker component
	checkDisableDate(day) {
		const dateString = moment(day).format('YYYY-DD-MM');
		return this.state.schedule[dateString] === true || moment(day).startOf('day').diff(moment().startOf('day')) < 0; // druhá podmínka jestli to neni v minulosti
	}

	//handle the appointment slot data from the database
	handleDBReponse(response) {
		const appointments = response;
		const today = moment().startOf('day'); //start of today 12 am
		const initialSchedule = {};
		initialSchedule[today.format('YYYY-DD-MM')] = Array(8).fill(true); // vlozim do currentschedule dnešek
		const schedule = !appointments.length // schedule = currentschedule nebo initialschedule, jestliže nemám žádné rezervace
			? initialSchedule
			: appointments.reduce((currentSchedule, appointment) => {
					const { slot_date, slot_time } = appointment; //slot_date = appointment.slot_date
					// const dateString = moment(slot_date, 'YYYY-DD-MM').format('YYYY-DD-MM'); //prevedu slot_date do pozadovaneho formatu
					if (currentSchedule[slot_date]) {
						currentSchedule[slot_date] = Array(8).fill(false);
					}

					if (Array.isArray(currentSchedule[slot_date])) {
						currentSchedule[slot_date][slot_time] = true;
					}

					return currentSchedule;
			  }, initialSchedule);
		console.log(schedule);

		/* for (let day in schedule) {
			let slots = schedule[day];
			// slots.length ? (slots.every(slot => slot === true) ? (schedule[day] = true) : null) : null;

			if (slots.length) {
				if (slots.every(slot => slot === true)) {
					schedule[day] = true;
				} else {
					return null;
				}
			} else {
				return null;
			}
		} */

		this.setState({
			schedule: schedule
		});
	}
	//display a modal with the userâ€™s inputted information and asks th user to confirm
	renderAppointmentConfirmation() {
		const spanStyle = { color: '#00C853' };
		return (
			<section>
				<p>
					Name:{' '}
					<span style={spanStyle}>
						{this.state.firstName} {this.state.lastName}
					</span>
				</p>
				<p>
					Email: <span style={spanStyle}>{this.state.email}</span>
				</p>
				<p>
					Appointment: <span style={spanStyle}>{moment(this.state.appointmentDate).format('dddd[,] MMMM Do[,] YYYY')}</span> at{' '}
					<span style={spanStyle}>{moment().hour(9).minute(0).add(this.state.appointmentSlot, 'hours').format('h:mm a')}</span>
				</p>
			</section>
		);
	}
	//renders available time slots to user and disables the rest if any
	renderAppointmentTimes() {
		if (!this.state.isLoading) {
			const slots = [...Array(8).keys()];
			return slots.map(slot => {
				const appointmentDateString = moment(this.state.appointmentDate).format('YYYY-DD-MM');
				const time1 = moment().hour(9).minute(0).add(slot, 'hours');
				const time2 = moment()
					.hour(9)
					.minute(0)
					.add(slot + 1, 'hours');
				const scheduleDisabled = this.state.schedule[appointmentDateString] //testuje datum na obsazenost jestliýe ano pak...
					? this.state.schedule[moment(this.state.appointmentDate).format('YYYY-DD-MM')][slot] // když ano vrátí 0-8
					: false;
				// console.log(scheduleDisabled + 'Jakub');
				const meridiemDisabled = this.state.appointmentMeridiem ? time1.format('a') === 'am' : time1.format('a') === 'pm';
				return (
					<RadioButton
						label={time1.format('h:mm a') + ' - ' + time2.format('h:mm a')}
						key={slot}
						value={slot}
						style={{
							marginBottom: 15,
							display: meridiemDisabled ? 'none' : 'inherit'
						}}
						disabled={scheduleDisabled || meridiemDisabled}
					/>
				);
			});
		} else {
			return null;
		}
	}

	renderStepActions(step) {
		const { stepIndex } = this.state;
		let formFinished = false;
		if (stepIndex === 2) {
			if (this.state.firstName && this.state.lastName && this.state.email) {
				formFinished = true;
			}
		}

		return (
			<div style={{ margin: '12px 0' }}>
				<Button
					variant="outlined"
					label={stepIndex === 2 ? 'Close' : 'Next'}
					disableTouchRipple={true}
					disableFocusRipple={true}
					primary={true}
					onClick={this.handleNext}
					// backgroundColor=""
					// style={{ marginRight: 12, backgroundColor: '#F12237' }}
					disabled={stepIndex === 2 && !formFinished}
				>
					{stepIndex === 2 ? 'Close' : 'Next'}
				</Button>

				{step > 0 && (
					<FlatButton
						label="Back"
						disabled={stepIndex === 0}
						/* a */
						onClick={this.handlePrev}
					/>
				)}
			</div>
		);
	}

	render() {
		const { finished, isLoading, smallScreen, stepIndex, confirmationModalOpen, confirmationSnackbarOpen, ...data } = this.state;
		const contactFormFilled = data.firstName && data.lastName && data.email;
		const DatePickerExampleSimple = () => (
			<div>
				<DatePicker
					hintText="Select Date"
					mode={smallScreen ? 'portrait' : 'landscape'}
					onChange={(n, date) => this.handleSetAppointmentDate(date)}
					shouldDisableDate={day => this.checkDisableDate(day)}
				/>
			</div>
		);
		const modalActions = [
			<FlatButton label="Cancel" primary={false} onClick={() => this.setState({ confirmationModalOpen: false })} />,
			<FlatButton label="Confirm" style={{ backgroundColor: '#00C853 !important' }} primary={true} onClick={() => this.handleSubmit()} />
		];

		return (
			<div>
				<AppBar title="Appointment Scheduler" iconClassNameRight="muidocs-icon-navigation-expand-more" />
				<section
					style={{
						maxWidth: !smallScreen ? '80%' : '100%',
						margin: 'auto',
						marginTop: !smallScreen ? 20 : 0
					}}
				>
					<Card
						style={{
							padding: '12px 12px 25px 12px',
							height: smallScreen ? '100vh' : null
						}}
					>
						<Stepper activeStep={stepIndex} orientation="vertical" linear={false}>
							<Step>
								<StepLabel>Choose an available day for your appointment</StepLabel>
								<StepContent>
									{DatePickerExampleSimple()}
									{/* {this.renderStepActions(0)} */}
								</StepContent>
							</Step>
							<Step disabled={!data.appointmentDate}>
								<StepLabel>Choose an available time for your appointment</StepLabel>
								<StepContent>
									<SelectField
										floatingLabelText="AM/PM"
										value={data.appointmentMeridiem}
										onChange={(evt, key, payload) => this.handleSetAppointmentMeridiem(payload)}
										selectionRenderer={value => (value ? 'PM' : 'AM')}
									>
										<MenuItem value={0} primaryText="AM" />
										<MenuItem value={1} primaryText="PM" />
									</SelectField>
									<RadioButtonGroup
										style={{
											marginTop: 15,
											marginLeft: 15
										}}
										name="appointmentTimes"
										defaultSelected={data.appointmentSlot}
										onChange={(evt, val) => this.handleSetAppointmentSlot(val)}
									>
										{this.renderAppointmentTimes()}
									</RadioButtonGroup>
									{this.renderStepActions(1)}
								</StepContent>
							</Step>
							<Step>
								<StepLabel>Share your contact information with us and we'll send you a reminder</StepLabel>
								<StepContent>
									{/* <p> */}
									<section>
										<TextField
											style={{ display: 'block' }}
											name="first_name"
											hintText="First Name"
											floatingLabelText="First Name"
											onChange={(evt, newValue) => this.setState({ firstName: newValue })}
										/>
										<TextField
											style={{ display: 'block' }}
											name="last_name"
											hintText="Last Name"
											floatingLabelText="Last Name"
											onChange={(evt, newValue) => this.setState({ lastName: newValue })}
										/>
										<TextField
											style={{ display: 'block' }}
											name="email"
											hintText="youraddress@mail.com"
											floatingLabelText="Email"
											onChange={(evt, newValue) => this.setState({ email: newValue })}
										/>
										<Button
											variant="outlined"
											style={{ display: 'block', backgroundColor: '#00C853' }}
											label={contactFormFilled ? 'Schedule' : 'Fill out your information to schedule'}
											labelPosition="before"
											primary={true}
											fullWidth={true}
											onClick={() =>
												this.setState({
													confirmationModalOpen: !this.state.confirmationModalOpen
												})
											}
											disabled={!contactFormFilled || data.processed}
										/>
									</section>
									{/* </p> */}
									{this.renderStepActions(2)}
								</StepContent>
							</Step>
						</Stepper>
					</Card>
					<Dialog modal={true} open={confirmationModalOpen} actions={modalActions} title="Confirm your appointment">
						{this.renderAppointmentConfirmation()}
					</Dialog>
					<SnackBar
						open={confirmationSnackbarOpen || isLoading ? true : false}
						message={isLoading ? 'Loading... ' : data.confirmationSnackbarMessage || ''}
						autoHideDuration={10000}
						onRequestClose={() => this.setState({ confirmationSnackbarOpen: false })}
					/>
				</section>
			</div>
		);
	}
}
export default AppointmentApp;
