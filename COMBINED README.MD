# Track A — Explainable AI for Cardiovascular Risk Assessment

A machine learning web application that estimates the probability of coronary artery disease (CAD) and individual coronary artery involvement, with a focus on explainability, visualization, and responsible AI.

## Overview

This project explores how machine learning can make cardiovascular risk assessment more accessible and interpretable. Users can enter patient clinical parameters and receive model-estimated probabilities for CAD and three major coronary arteries: the left anterior descending artery (LAD), left circumflex artery (LCX), and right coronary artery (RCA).

The application combines predictive models, feature-level explanations, and an interactive 3D heart visualization to help users explore the results.

**This is a research prototype, not a medical diagnostic tool. Its predictions must not replace professional medical advice or clinical evaluation.**

## Features

- **Four prediction models:** Separate models for CAD, LAD, LCX, and RCA.
- **Interactive web interface:** Enter clinical parameters and view model outputs.
- **Explainable AI:** Explore how input features contribute to predictions.
- **3D heart visualization:** Provide anatomical context for the coronary arteries.
- **Model evaluation:** Evaluate predictive performance using repeated cross-validation and probability-based metrics.
- **Responsible AI messaging:** Communicate uncertainty, limitations, and appropriate next steps.

## Dataset

We used the [UCI Z-Alizadeh Sani dataset](https://archive.ics.uci.edu/), which contains 303 patient records and 59 features.

The dataset includes demographic characteristics, symptoms, clinical measurements, and other patient attributes relevant to coronary artery disease.

The dataset is relatively small, and its outcomes have different levels of class imbalance. These limitations are considered when evaluating and interpreting the models.

## Machine Learning Approach

We trained separate models for the four prediction tasks instead of assuming that one model would perform equally well for every outcome.

Model evaluation uses repeated 5-fold cross-validation, with hyperparameter tuning performed within the training folds.

The models are evaluated using metrics such as:

- **ROC-AUC:** Measures how well a model distinguishes between outcome classes.
- **Brier score:** Measures the quality of predicted probabilities.
- **Feature contributions:** Help explain how individual inputs influence model predictions.

Performance varies across prediction tasks, so the results should be interpreted separately for each model.

## Tech Stack

**Frontend**
- React
- Vite
- TypeScript

**Backend**
- Python
- FastAPI
- Scikit-learn
- XGBoost

**Explainability and visualization**
- SHAP / model-specific feature contributions
- Interactive 3D heart visualization

## Repository Structure

The project source code is maintained in two repositories.

| Component | Repository |
|---|---|
| Frontend — user interface and visualization | https://github.com/Ritikasewa/trackA_frontend|
| Backend — prediction API and machine learning models |https://github.com/Ritikasewa/trackA_backend|

The frontend communicates with the backend API to obtain predictions and display the results.

## Running the Project

The frontend and backend are maintained separately, so each must be configured and started independently.

### Backend

1. Clone the backend repository.
2. Create and activate a Python virtual environment.
3. Install the dependencies listed in the repository's `requirements.txt` or project configuration.
4. Configure any required environment variables.
5. Start the FastAPI application using the instructions provided in the backend repository.

### Frontend

1. Clone the frontend repository.
2. Install the dependencies using the project's package manager.
3. Configure the backend API URL using the documented environment variable.
4. Start the development server.

Use the setup instructions in each repository for the exact commands and configuration required.

## Validation and Limitations

The models were evaluated using repeated cross-validation rather than relying solely on a single train-test split. Their performance differs across CAD, LAD, LCX, and RCA.

The dataset contains only 303 records and may not represent broader patient populations. Cross-validation does not establish clinical validity, and the results require external validation on larger, independent datasets before any consideration of clinical use.

The predicted probabilities are model estimates, not confirmed probabilities of disease for an individual patient. Feature explanations describe model behavior and do not establish causation.

## Disclaimer

This application is intended for educational and research purposes only. It is not intended to diagnose, treat, cure, or prevent any disease. Do not use its predictions to make medical decisions or delay seeking care. Consult a qualified healthcare professional for medical assessment.

## Future Improvements

- Validate the models on larger, independent datasets.
- Improve probability calibration and evaluate performance across patient subgroups.
- Refine feature explanations and the 3D visualization.
- Conduct usability testing and strengthen the application's clinical safety messaging.

## Acknowledgements

We acknowledge the creators of the UCI Z-Alizadeh Sani dataset and the open-source tools used to develop this project.
