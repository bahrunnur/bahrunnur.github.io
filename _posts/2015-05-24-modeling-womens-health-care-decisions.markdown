---
title: "How do I do it: 'Modeling Women's Health Care Decisions'"
date: 2015-05-24 01:00:00
description: "My approaches for \"Modeling Women's Health Care Decisions\" competition that hosted by DrivenData"
---

Planned Parenthood wants to assist women in America to choose proper health-care service for them. So, they were hosted a competition at DrivenData to challenge Data Scientist around the world to predict which reproductive health-care services accessed by women in America.

More about problem description: [http://www.drivendata.org/competitions/6/page/26/](http://www.drivendata.org/competitions/6/page/26/)

---

*Modeling Women's Health Care Decisions* was a tough challenge. There are 1377 features containing 3 data type:

1. ***Numerical Data***, data that represented in column that has `n_` prefix on column name.
2. ***Ordinal Data***, data that represented in column that has `o_` prefix on column name.
3. ***Categorical Data***, data that represented in column that has `c_` prefix on column name.

What could be the worst? The data was filled with many missing values. 

![Missing Values Histogram](http://s13.postimg.org/zaigdo207/missing.png)

As you can see, there are near 900 column that has ~14000 missing values in train data. The train data size is 14644, so the missing values in this dataset is humongous.

Why there were so many missing values in the data? 

That data came from National Survey of Family Growth. The responder has the option to not giving sensitive informations to some question. This thing is very common in survey data, and there has a workaround to impute this missing values. Such missing values are known as *disguised missing data*. 


## Before Going Deep
If you don't familiar at all with Machine Learning you should read this first: [Practical Machine Learning For The Uninitiated](http://devquixote.com/data/2015/04/18/practical-machine-learning-for-the-uninitiated/)

Although the author states that you don't necessarily need to understand the underlying concept and mathematics,  I think you must going deep into mathematics lair behind Machine Learning. Because it provides you with robust understanding what was happen. And it could give you some idea how to ***handle*** data properly not just how to collect it. For that reason I am highly suggest you to take a time to watch video lectures at [Machine Learning](https://www.coursera.org/course/ml) course from Andrew Ng.


## Multi-Label Classification
The goal of this task was to predict which reproductive health care services that are accessed by women in America. There is 14 service available to choose from. Encoded with alphabetical name prefixed with `service_` (ex: `service_a`). The service labels is not an exclusive one. That means, a record can belong to many service labels. This kind of classification task is called [Multi-label classification](https://www.wikiwand.com/en/Multi-label_classification).

There are many approaches to solve this task. But I opted to use more simple one like One vs Rest. That is each of labels prediction has it's own classifier. Therefore we have 14 classifiers for each of 14 services.


## Bird's View
These are the outlines of my approach:

```
1. Preprocessing
    1. Threshold checking
    2. Impute Missing Values in: 
        - Ordinal Features
        - Numerical Features
        - Categorical Features
2. Train a classifier
    1. Measuring model performance (Local Validation)
    2. Tuning Hyperparameter
3. Making a prediction
```

## Imputation of Missing Values
Because there were so many missing values, this is what I do first. I conducted a brainstorm session to create many speculations of how to solve that problem. I have tried all speculation I have, and settled with speculation that has maximum contribution to model performance.

So, here are my best speculation to deal with missing values:

#### General
I was applied the threshold checking at the beginning of data preprocess. If filled values in respective column was below 1% of data (total rows). I assign that missing values with these: 

- `-1` for Numerical Features.
- `-10` for Ordinal Features.
- `missing` for Categorical Features, although I didn't do threshold checking for categorical features.

#### Numerical
For numerical data, I imputed missing cell with mean value of that column, if standard deviance in that column is below than 1. I think it's intuitive, standard deviance below 1 indicating that many data points are near mean value. 

If standard deviance above 1, I filled that with median value.

#### Ordinal
This thing was drives me crazy. I don't know whether to treat it like category or just real numbers. This was my best, I am treated the missing values as mode of that column. After that, I transformed the ordinal values with sigmoid function to get non-linear representation of ordering.

I have tried to treat this like categorical features, but the performance was overshadowed by my approach that using sigmoid transform.

#### Categorical
This one was simple, there is a high probability that missing data was just meant to be null, none, or nothing. So, I assigned the missing values with `missing` category. To indicate that data point is belong to uncertain category that the responder is not knowing too.

If you want to learn more about imputing *disguised missing data* there is a paper that you can read: [Cleaning Disguised Missing Data: A Heuristic Approach](https://www.cs.sfu.ca/~jpei/publications/dmv-kdd07.pdf)


## Release Feature
This was a column that may indicates seasonal pattern of data. But I treated it just like the category variable. I haven't had know how to handle time-series data properly.


## Feature Engineering
Engineering some feature from obfuscated data is a laborious job. We must try every combination and evaluate it. Although I didn't do it, I think I don't really need this. Because the model (Gradient Boosting Tree) that I used can capture interaction/dependency between features automatically. One of the Feature Engineering purpose is to discover hidden relation between features.

If you want to learn more about Feature Engineering these are some resources that will tamper your knowledge: [Discover Feature Engineering, How to Engineer Features and How to Get Good at It](http://machinelearningmastery.com/discover-feature-engineering-how-to-engineer-features-and-how-to-get-good-at-it/)


## Model Selection
This is the list of model that I try:

1. Logistic Regression
2. Random Forest
3. Gradient Boosting Tree

### Logistic Regression
Logistic Regression was a nimble classifier and has sufficient accuracy. But it couldn't capture interaction between category variable implicitly like Decision Tree based model. We should create the column that indicating interaction explicitly and feed that to Logistic Regression.

Interaction between features was very important for this case. Because  survey answers are predicated on answering other questions; for example:

    > Do you have any children? (YES/NO)
    YES
    > How many children do you have?
    2

The answer for "How many children do you have?" will be represented by a `NaN` value if the respondent has never had children (`NO` answer was given).

#### Logistic Regression Performance
Using Logistic Regression from scikit package. 
`LogisticRegression(penalty='l1')`

    - Start.
    -- Data loaded.
    --- Evaluating Logistic Regression.
    --- Multiclass logloss on validation set: 0.3053
    --- Train time on validation set: 164.995721102 seconds
    -- Finished training.
    - Finished.

Logistic Regression is a simple model to comprehend. You can learn about it in here: [http://ajourneyintodatascience.com/logistic-regression/](http://ajourneyintodatascience.com/logistic-regression/)

### Random Forest
This model was more accurate than Logistic Regression. Because this model could capture interaction between features using Decision Tree. The accuracy comes from ensembling of many weak decision stumps (estimator). Random Forest use Bagging method for ensembling. 

Bagging method is a method that calculate average scores (probabilities) from all weak decision stumps. The numbers of weak decision stumps could be specified with `n_estimators` parameter in scikit-learn's Random Forest package.

Learn more about Random Forest: [https://www.kaggle.com/wiki/RandomForests](https://www.kaggle.com/wiki/RandomForests)

#### Random Forest Performance
Using Random Forest from scikit package. 
`RandomForestClassifier(n_estimators=200)`

    - Start.
    -- Data loaded.
    --- Evaluating Random Forest.
    --- Multiclass logloss on validation set: 0.2790
    --- Train time on validation set: 1305.64292622 seconds
    -- Finished training.
    - Finished.
 
However, there was a model that has better accuracy. This leads me to Gradient Boosting Tree.

### Gradient Boosting Tree
Gradient Boosting Tree is a generalization of boosting methods by allowing optimization of an arbitrary differentiable loss function.

**Advantages:**

* Natural handling of data with mixed type.
* Robustness to outliers in input space (via robust loss functions).
* Supportive for different Loss functions.
* Automatically detects non-linear feature interactions.

**Disadvantages:**

* Requires careful tuning.
* Slow to train, but fast in prediction.
* Cannot Extrapolate.

Given by that, this was my final model for the competition. I could invest a lot of time to tune it properly. And I assigned regularized parameters properly high, because the lack of extrapolate ability from this model.

#### Gradient Boosting Tree Performance
Using xgboost with this parameters given to classifier:

    'max_depth': 6
    'num_round': 512
    'gamma': 1.0
    'min_child_weight': 4
    'eta': 0.025
    'objective': 'binary:logistic'
    'eval_metric': 'logloss'
    'nthread': 4

List of all Parameters in xgboost: [https://github.com/dmlc/xgboost/blob/master/doc/parameter.md](https://github.com/dmlc/xgboost/blob/master/doc/parameter.md)

Performance:
    
    - Start.
    -- Data loaded.
    --- Evaluating xgboost gbt.
    --- Multiclass logloss on validation set: 0.2528
    --- Train time on validation set: 9474.53318286 seconds
    -- Finished training.
    - Finished.

As you can see, it took roughly 3 hours to train. But, the accuracy was astonishing.

Learn more about this model: [Introduction to Boosted Trees](http://homes.cs.washington.edu/~tqchen/pdf/BoostedTree.pdf)


## Tuning Classifier Hyperparameter
I didn't do fancy stuff like Grid Search. I just did binary search manually. Assign some arbitrary values, increasing or decreasing that value, if there has been found an improvement, gradually increase it until the classifier reach stable point that could not be improved again.

### Logistic Regression
I didn't tune my Logistic Regression model.

### Random Forest
If you increase number of estimators of Random Forest, you can achieve more accuracy. But, the computation cost would be exploded.

### Gradient Boosting Tree
There was an insight if we are using Gradient Boosting Tree. First, we tune parameters excepting number of rounds and learning rate. Because that parameters tend to be easier and faster to get the stable point after that. 

After we settle some values for that *other* parameters. We're starting to tune how many rounds of boosting and tuning learning rate. If these two parameters tuned properly, we could obtain global optimum performance of the model.

It's an art to get proportional rate between number of rounds and learning rate in Boosting method.

#### What is Hyperparameter?
Hyperparameter is a set of values to be given as configuration for a model. This term was used to distinguish it between parameters that were meant to be learned at model's learning process.


## Evaluating Models
This competition used *Multi-Label Log Loss* to measure the *misclassification* rate of model. I replicated that metric into local environment to get performance measurement of my model without submitting it to leaderboard.

For the local validation set, I split training data to two fold. With training proportion is `0.8`, and proportion of validation set is `0.2`.

I used that proportion because the test set size is: `3661` and train set size: `14644`. The proportion of test set to train set is: `3661 / (14644 + 3661) = 0.2`. This is a reasonable proportion between train and test.

### What is Validation Set?
Validation set is a subset of train data that are not trained during evaluating our model. We predict validation labels and compare that to real labels that we held out before.

## What I learned
I'm a human being who just only know small portion in this field. So, this is what I learnt:

Dealing with many missing values expanded my creativity horizon. I have created many speculations of how to handle data properly. I believe if you treat data properly, your model performance will increase significantly. At first, my approacs was just discard column that has missing values. This leads me to loss of information. When I deployed the missing values treatment, my model performance was increasing gradually.

This competition also teach me how to choose model properly. Because I learned many model's characteristics. I started with simple Logistic Regression, gradually move into Random Forest, and finally settled with Gradient Boosting Tree.

My personal opinion, If you want to increase model performance further. You could employ powerful machine to take large number of how many boosting rounds you want. Although this might lead to overfit. But you have regularization terms to penalize it. This is one kind of optimization using powerful machine to search all possibilities efficiently. 

> What about to try it on Quantum Computers?


## Closure
Congratulation to Giba who won in this competition. His approaches was using ensemble of many models. Although he did simple imputaion of missing values, his models perform better than me. Learning from Giba, in the future I will consider to try using ensemble of many models. Here is Giba explanation of what he did: [http://community.drivendata.org/t/1st-place-solution/122](http://community.drivendata.org/t/1st-place-solution/122)

Also, check out the code of my approaches at: [https://github.com/bahrunnur/drivendata-women-healthcare](https://github.com/bahrunnur/drivendata-women-healthcare)
