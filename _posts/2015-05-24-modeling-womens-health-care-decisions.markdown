---
title: "How do I do it: \"Modeling Women's Health Care Decisions\""
date: 2015-05-24 01:00:00
description: "My approaches for \"Modeling Women's Health Care Decisions\" competition that hosted by DrivenData"
---

Planned Parenthood wants to assist women in America to choose proper health care for them. So, they are hosting competition at DrivenData to challenge Data Scientist around the world to predict which reproductive health care services are accessed by women in America.

More about problem description: [http://www.drivendata.org/competitions/6/page/26/](http://www.drivendata.org/competitions/6/page/26/)

---

Modeling Women's Health Care Decisions is a tough challenge. There are 1377 features containing 3 data type:

1. ***Numerical Data***, data that represented in column that has `n_` prefix on column name.
2. ***Ordinal Data***, data that represented in column that has `o_` prefix on column name.
3. ***Categorical Data***, data that represented in column that has `c_` prefix on column name.

What could be the worst? The data is filled with so many missing values. 

![Missing Values Histogram](http://s13.postimg.org/zaigdo207/missing.png)

As you can see, there is near 900 column that has ~14000 missing values in train set. The train set size is 14644, so the missing values in this dataset is humongous.

Why there is so many missing values in the data? 

The data came from National Survey of Family Growth. The responder has the option to not giving sensitive informations to some question. This thing is very common in survey data, and there has a workaround to impute this missing values. Such missing values are known as *disguised missing data*. 


## Before Going Deep
If you don't familiar at all with Machine Learning you should read this first: [Practical Machine Learning For The Uninitiated](http://devquixote.com/data/2015/04/18/practical-machine-learning-for-the-uninitiated/)

Although the author states that you don't necessarily need to understand the underlying concept and mathematics,  I think you must going deep into mathematics lair behind Machine Learning. Because it provides you with robust understanding what was happen. And it could give you some idea how to ***handle*** data properly not just how to collect it. For that reason I am highly suggest you to take a time to watch this video in incredible [Machine Learning](https://www.coursera.org/course/ml) course from Andrew Ng.


## Multi-Label Classification
The goal of this task is to predict which reproductive health care services that are accessed by women in America. There is 14 service available to choose from. Encoded with alphabetical name prefixed with `service_` (ex: `service_a`). The service labels is not an exclusive one. That means, a record can belong to many service labels. This kind of classification task is called [Multi-label classification](https://www.wikiwand.com/en/Multi-label_classification).

There are many approaches to solve this task. But I opted to use more simple one like One vs Rest. That is each of labels prediction has it's own classifier. Therefore we have 14 classifiers for each of 14 services.


## Imputation of Missing Values
Because there are so many missing values, so this is what I do first. I have done such a brainstorm session to create many speculation how to handle that. I have tried all speculation I have, and settled with speculation that has maximum contribution to model performance.

So, here is my best speculation to deal with missing values:

#### General
I apply the threshold to checking it first. If filled values in respective column was below 1% of data. I assign that missing values with negative value. 

- `-1` for Numeric Features
- `-10` for Ordinal Features.
- `missing` for Categorical Features, although I didn't use threshold checking for categorical.

#### Numerical
For numerical data, I impute missing cell with mean if standard deviance in that column is below than 1. I think this is intuitive, standard deviance below 1 indicating that many data points are near mean value. 

If standard deviance above 1, I fill that with median.

#### Ordinal
This thing is what drives me crazy. Because I don't know whether to treat it like category or just real numbers. This is my best, I treat the missing values as mode of that column. After that, I transform ordinal values with sigmoid function to get non-linear representation of ordering.

I also try treating this like category, but the performance was overshadowed by my approach that using sigmoid transform.

#### Categorical
This one is simple, there is a high probability that missing data is just meant to be null, none, or nothing. So, I assign the missing values with `missing` category. To indicate that this data point is belong to uncertain category that the responder is not knowing too.

If you want to learn more about imputing *disguised missing data* there is a paper that you can read: [Cleaning Disguised Missing Data: A Heuristic Approach](https://www.cs.sfu.ca/~jpei/publications/dmv-kdd07.pdf)


## Release Feature
This is a column that may indicates seasonal pattern of data. But I treat it just like the category variable. I'm yet to know how to handle time-series data properly.


## Feature Engineering
Engineering some feature from obfuscated data is laborious. We must try every combination and evaluate it. Although I didn't do it, I think I don't really need this. Because the model (Gradient Boosting Tree) that I use can capture interaction/dependency between features automatically.

If you want to learn more about Feature Engineering this is some resources that will tamper your knowledge: [Discover Feature Engineering, How to Engineer Features and How to Get Good at It](http://machinelearningmastery.com/discover-feature-engineering-how-to-engineer-features-and-how-to-get-good-at-it/)


## Model Selection
This is the list of model that I try:

1. Logistic Regression
2. Random Forest
3. Gradient Boosting Tree

### Logistic Regression
Logistic Regression is nimble and has sufficient accuracy. But it couldn't capture interaction between category variable implicitly like Decision Tree based model. We should create the column that indicating interaction explicitly and feed that to Logistic Regression.

Interaction between features is very important in this case. Because  survey answers are predicated on answering other questions; for example:

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

### Random Forest
This is more accurate than Logistic Regression. Because this model could capture interaction between feature. The accuracy comes from ensembling of many weak decision stumps.

However, there is a model that has better accuracy. This leads me to Gradient Boosting Tree.

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

Given by that, this is my final model for the competition. I could invest time to tune it properly. Given the weakness of it could leads me to overfit, I assign regularized parameters properly high.

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

Performance:
    
    - Start.
    -- Data loaded.
    --- Evaluating xgboost gbt.
    --- Multiclass logloss on validation set: 0.2528
    --- Train time on validation set: 9474.53318286 seconds
    -- Finished training.
    - Finished.

As you can see, it takes roughly 3 hours to train. But, the accuracy was astonishing.


## Tuning Classifier Hyperparameter
I didn't do any fancy stuff like Grid Search. I'm just doing binary search manually. Inserting some arbitrary values, increasing that value, if there has been found an improvement, gradually increase it until the classifier reach stable point that could not be improved again.

### Logistic Regression
I didn't tune my Logistic Regression model.

### Random Forest
If you increase number of estimators of Random Forest, you can achieve more accuracy. But, be wary about overfitting.

### Gradient Boosting Tree
There is an insight if we are using Gradient Boosting Tree. First, we tune parameters excepting number of rounds and learning rate. Because that parameters tend to be easier and faster to get the stable point. 

After we settle some value for that *other* parameters. We're starting to tune how many rounds of boosting and tuning learning rate. If this two parameters tuned properly, we could obtain global optimum performance of the model.

It is an art to get proportional rate between number of rounds and learning rate in Boosting method.

#### What is Hyperparameter?
Hyperparameter is just like parameter that are given to your model equation. This is different with parameters that are meant to be learned by model itself.


## Evaluating Models
This competition use multi-label Log Loss to measure the *misclassification* rate of model. I replicating that into local environment to get performance measurement of my model without submitting it to leaderboard.

For the local validation set, I split training data into two fold. With training proportion is `0.8`, and proportion of validation set is `0.2`.

I use that proportion because the test set size is: `3661` and train set size: `14644`. The proportion of test set to train set is: `3661 / (14644 + 3661) = 0.2`. This is a reasonable proportion between train and test.

### What is Validation Set?
Validation set is a subset of train data that are not trained during evaluating our model. We predict validation labels and compare that to real labels that we held out before.

## What I learned
I'm also a human being who just only know small portion in this field. So, this is what I learnt:

Dealing with many missing values expand my creativity horizon. I have created many speculation how to handle data properly. Because I believe if you treat data properly, your model performance will increase significantly. At first, my model just discard column that has many missing values. This leads me to loss of information. When I employ the missing values treatment, my model performance is increasing gradually.

This competition also teach me how to choose model properly. I start with simple Logistic Regression into Random Forest and finally settled with Gradient Boosting Tree.

My personal opinion, If you want to increase model performance further. You could employ powerful machine to take large number of how many boosting rounds you want. Although this could lead us to overfit. But you also has regularization terms to penalize it. This is a type of optimization using powerful machine to search all of possibilities efficiently. 

> What about to try it on Quantum Computers?


## Closure
Congratulation to Giba who won in this competition. His approaches is using ensemble of many models. Although he did simple imputaion of missing values, his models perform better than me. Learning from Giba, in the future I will consider to try using ensemble of many models. Here is Giba explanation of what he did: [http://community.drivendata.org/t/1st-place-solution/122](http://community.drivendata.org/t/1st-place-solution/122)

Also, check out the code of my approaches at: [https://github.com/bahrunnur/drivendata-women-healthcare](https://github.com/bahrunnur/drivendata-women-healthcare)
