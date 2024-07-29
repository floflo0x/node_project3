const express = require('express');

const { body, validationResult } = require('express-validator');

const QRCode = require('qrcode');

const request = require("request");

const baseUrl = "https://api.h4kig.cc/api/app/connection/";

const isAuth = require('../middleware/is_auth');

const router = express.Router();

let selectFunction = (item) => {
  let options = {
	  method: "POST",
	  url: baseUrl + "select.php",
	  headers: {
	  	charset: 'UTF-8'
	  },
	  formData: {
	    select_query: item,
	  },
	  withCredentials: true
	  // credentials: "include"
  };
  return options;
};

let insertFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl + "insert.php",
    formData: {
      insert_query: item,
      select_query: item2,
    },
    withCredentials: true
  };
  return options;
};

let updateFunction = (item, item2) => {
	let options = {
	    method: "POST",
	    url: baseUrl + "update.php",
	    formData: {
	      update_query: item,
	      select_query: item2,
	    },
	    withCredentials: true
  	};
  	return options;
};

let deleteFunction = (item, item2) => {
	let options = {
	    method: "POST",
	    url: baseUrl + "delete.php",
	    formData: {
	      delete_query: item,
	      select_query: item2,
	    },
	    withCredentials: true
  	};
  	return options;
};

router.get('/', async(req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const itemsPerPage = 10;
		const category = req.query.category || 'new';

		let opt1 = selectFunction(
			"select ec_product_collection_products.product_id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_collections.slug as label, ec_product_labels.name as lname, ec_product_categories.name as category from ec_product_collections inner join ec_product_collection_products on ec_product_collections.id = ec_product_collection_products.product_collection_id inner join ec_products on ec_product_collection_products.product_id = ec_products.id inner join ec_product_label_products on ec_product_label_products.product_id = ec_products.id inner join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id inner join ec_product_category_product on ec_product_category_product.product_id = ec_product_collection_products.product_id inner join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id"
		);

		let isAuthenticated = false;

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);
				// console.log(req.session);

				// console.log(x.length, category, page);
        // console.log(x);
				// console.log(req.session.isLoggedIn, req.session.user, req.session.user == '');

				const email = (req.user !== undefined ? req.user?.email : '');

				const isLoggedIn = req.session.isLoggedIn === 'true' || req.session.isLoggedIn === true;

				const isAuthenticated = (email !== '' && isLoggedIn);

				// ((email !== '' && req.session.isLoggedIn) ? isAuthenticated = true : isAuthenticated = false);

				// console.log(email, isAuthenticated);

				let opt2 = selectFunction(
					"select COUNT(*) as cLength from hCart where email = '"
					.concat(`${email}`)
					.concat("' limit 10 offset 0")
				);

				request(opt2, (error, response) => {
					if (error) throw new Error(error);
					else {
						let y = JSON.parse(response.body);

						// console.log(y);

						if (x.length >= 1) {
							const newProducts = x.filter((product) => product.label === 'new-arrival');
							const bestSellers = x.filter((product) => product.label === 'best-sellers');
							const specialOffers = x.filter((product) => product.label === 'special-offer');

							// console.log(newProducts, bestSellers, specialOffers);
							let nPPages = [];
							let bSPages = [];
							let sOPages = [];
              let cp = 1;

							if (category === 'new') {
								nPPages = paginateProducts(newProducts, page);
								bSPages = paginateProducts(bestSellers, cp = 1);
								sOPages = paginateProducts(specialOffers, cp = 1);
							}

							else if (category === 'bestsellers') {
								nPPages = paginateProducts(newProducts, cp = 1);
								bSPages = paginateProducts(bestSellers, page);
								sOPages = paginateProducts(specialOffers, cp = 1);
							}

							else if (category === 'special_offer') {
								nPPages = paginateProducts(newProducts, cp = 1);
								bSPages = paginateProducts(bestSellers, cp = 1);
								sOPages = paginateProducts(specialOffers, page);
							}

							else {
								nPPages = paginateProducts(newProducts, cp = 1);
								bSPages = paginateProducts(bestSellers, cp = 1);
								sOPages = paginateProducts(specialOffers, cp = 1);
							}

					    function paginateProducts(newProducts, cp) {
								const totalCount = newProducts.length;
					      const pageCount = Math.ceil(totalCount / itemsPerPage);

					      // Calculate start and end indices for pagination
					      const startIndex = (cp - 1) * itemsPerPage;
					      const endIndex = startIndex + itemsPerPage;

					      // Slice the results array based on pagination
					      const paginatedResults = newProducts.slice(startIndex, endIndex);
					      // console.log(paginatedResults);
					      return {data: paginatedResults, pageCount: pageCount};
					    }

							const { data: nData, pageCount: nPC } = nPPages;
							const { data: bsData, pageCount: bsPC } = bSPages;
							const { data: soData, pageCount: soPC } = sOPages;

							// console.log(nPC, bsPC, soPC);
							// console.log(nData.length, bsData.length, soData.length);

							return res.render('user/home', 
								{
									title: "Home",
									lang: req.lang,
									isAuth: isAuthenticated,
									cart: y[0].cLength,
									// cart: '6',
									nData: nData,
									bsData: bsData,
									soData: soData,
									category: category,
									currentPage: page,
				        	nPC: nPC,
				        	bsPC: bsPC,
				        	soPC: soPC
								}
							)
						}

						else {
							return res.render('user/home', 
								{
									title: "Home",
									lang: req.lang,
									isAuth: isAuthenticated,
									cart: y[0].cLength,
									nData: [],
									bsData: [],
									soData: [],
									category: category,
									currentPage: page,
				        	nPC: 0,
				        	bsPC: 0,
				        	soPC: 0
								}
							)
						}
					}
				})
			}
		})
	}

	catch(error) {
		return res.render('user/home', 
			{
				title: "Home",
				lang: req.lang,
				isAuth: false,
				cart: '0',
				nData: [],
				bsData: [],
				soData: [],
				category: '',
				currentPage: '',
				nPC: 0,
				bsPC: 0,
				soPC: 0
			}
		)
	}
})

router.get('/v1/details/:name', async (req, res, next) => {
	try {
		const { name } = req.params;
    		
    let opt1 = selectFunction(
      "SELECT ec_products.id, ec_products.name AS pName, ec_products.image, ec_products.price, ec_products.description, ec_products.stock_status as instock, ec_product_categories.name AS category, ec_options.name AS warranty, GROUP_CONCAT(ec_option_value.option_value) AS options, GROUP_CONCAT(ec_option_value.affect_price) as affect_price, GROUP_CONCAT(ec_option_value.id) as optionId FROM ec_products LEFT JOIN ec_product_category_product ON ec_product_category_product.product_id = ec_products.id LEFT JOIN ec_product_categories ON ec_product_categories.id = ec_product_category_product.category_id LEFT JOIN ec_options ON ec_options.product_id = ec_products.id LEFT JOIN ec_option_value ON ec_options.id = ec_option_value.option_id WHERE ec_products.name LIKE '%"
        .concat(`${name}`)
        .concat("%' limit 10 offset 0")
    );

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				const email = (req.user !== undefined ? req.user?.email : '');

				const isLoggedIn = req.session.isLoggedIn === 'true' || req.session.isLoggedIn === true;

				const isAuthenticated = (email !== '' && isLoggedIn);

				// (email !== undefined ? isAuthenticated = true : isAuthenticated = false);
        
        let options = [];
        let affect_price = [];
        let optionId = [];

				// console.log(isAuthenticated);
        
        const id = x[0].id;
				const category = x[0].category;
        if (x[0].options !== null) {
				 options = x[0].options.split(',');
        }
        if (x[0].affect_price !== null) {
				  affect_price = x[0].affect_price.split(',');
        }
        if (x[0].optionId !== null) {
				 optionId = x[0].optionId.split(',');
        }
				const lang = req.lang.smws.lang;

				let description = "";

				// console.log(lang, id, category, options, affect_price);

				if (lang == 'en') {
					let opt2 = selectFunction(
		    		"SELECT ec_products_translations.description from ec_products_translations WHERE ec_products_translations.ec_products_id = "
		    		.concat(`${id}`)
		    		.concat(" limit 10 offset 0")
					);

					request(opt2, (error, response) => {
						if (error) throw new Error(error);
						else {
							let y1 = JSON.parse(response.body);

							// console.log(y1);

							if (y1.length >= 1) {
								description = y1[0].description;
								// console.log(description);
							}
						}
					})
				}

				let opt4 = selectFunction(
					"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_product_categories.name = '"
						.concat(`${category}`)
						.concat("' limit 3 offset 0")
				);

				request(opt4, (error, response) => {
					if (error) throw new Error(error);
					else {
						let z = JSON.parse(response.body);

						// console.log(z);

						if (x.length >= 1) {
							let opt3 = selectFunction(
								"select COUNT(*) as cLength from hCart where email = '"
									.concat(`${email}`)
									.concat("'")
							);

							request(opt3, (error, response) => {
								if (error) throw new Error(error);
								else {
									let y = JSON.parse(response.body);

									// console.log(y);

									if (y.length >= 1) {
										return res.render("user/details", {
											title: "Details",
											lang: req.lang,
											products: x,
											description: description,
											name: name,
											options: options,
											optionId: optionId,
											affect_price: affect_price,
											relatedProduct: z,
											isAuth: isAuthenticated,
											cart: y[0].cLength
										})
									}

									else {
										return res.render('user/details', 
											{
												title: "Details",
												lang: req.lang,
												products: x,
												description: description,
												name: name,
												options: options,
												optionId: optionId,
												affect_price: affect_price,
												relatedProduct: z,
												isAuth: isAuthenticated,
												cart: 0
											}
										)
									}
								}
							})
						}

						else {
							return res.render('user/details', 
								{
									title: "Details",
									lang: req.lang,
									products: x,
									description: description,
									name: name,
									options: options,
									optionId: optionId,
									affect_price: affect_price,
									relatedProduct: z,
									isAuth: isAuthenticated,
									cart: 0
								}
							)
						}
					}
				})
			}
		})
	}

	catch(error) {
		return res.render('user/details', 
			{
				title: "Details",
				lang: req.lang,
				products: [],
				name: '',
				relatedProduct: [],
				isAuth: false,
				cart: '0'
			}
		)
	}
})

router.get('/v1/product_categories', async (req, res, next) => {
	try {
		const { category, name } = req.query;
    
    const type = req.query.type || '';

		const page = parseInt(req.query.page) || 1;
		const itemsPerPage = 10;

		// console.log("cat = " + category);
		// console.log("name = " + name);
		// console.log("type = " + type);

		let opt1 = '';

		if (category == 'all' && !name) {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_products.product_type, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id"
			);
		}

		else if (!category && name !== '') {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_products.product_type, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_products.name LIKE '%"
				.concat(`${name}`)
				.concat("%'")
			);
		}

		else if (category !== '' && name !== '') {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_products.product_type, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_product_categories.name = '"
				.concat(`${category}`)
				.concat("' AND ec_products.name LIKE '%")
				.concat(`${name}`)
				.concat("%'")
			);
		}

		else if (category !== '' && !name) {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_products.product_type, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_product_categories.name = '"
				.concat(`${category}`)
				.concat("'")
			);
		}
    
		else if (type !== '') {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_products.product_type, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_products.product_type = '"
        .concat(`${type}`)
        .concat("'")
			);
		}

		else if (!category && !name) {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_products.product_type, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id"
			);
		}

		else {
			return res.redirect("/");
		}

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x.length);

				const email = (req.user !== undefined ? req.user?.email : '');

				const isLoggedIn = req.session.isLoggedIn === 'true' || req.session.isLoggedIn === true;

				const isAuthenticated = (email !== '' && isLoggedIn);

				// (email !== undefined ? isAuthenticated = true : isAuthenticated = false);

				// console.log(isAuthenticated);

				let opt2 = selectFunction(
					"select COUNT(*) AS cLength from hCart where email = '"
					.concat(`${email}`)
					.concat("'")
				);

				request(opt2, (error, response) => {
					if (error) throw new Error(error);
					else {
						let z = JSON.parse(response.body);

						// console.log(z);
						if (x.length >= 1) {
							const totalCount = x.length;
				      const pageCount = Math.ceil(totalCount / itemsPerPage);

				      // Calculate start and end indices for pagination
				      const startIndex = (page - 1) * itemsPerPage;
				      const endIndex = startIndex + itemsPerPage;

				      // Slice the results array based on pagination
				      const paginatedResults = x.slice(startIndex, endIndex);
				      // console.log(paginatedResults);
				      // console.log(pageCount);

							return res.render("user/category", {
								title: "Category",
								lang: req.lang,
								products: paginatedResults,
								category: category,
								name: name,
                type: type,
								isAuth: isAuthenticated,
								cart: z[0].cLength,
								currentPage: page,
				        pageCount: pageCount
							})
						}

						else {
							return res.render("user/category", {
								title: "Category",
								lang: req.lang,
								products: [],
								category: category,
								name: name,
                type: type,
								isAuth: isAuthenticated,
								cart: z[0].cLength,
								currentPage: 0,
				        pageCount: 0
							})
						}
					}
				})
			}
		})
	}

	catch(error) {
		return res.redirect("/");
	}
})

// isAuth
router.post('/v1/cart', isAuth, async (req, res, next) => {
	try {
		const { quantity, productId, warrantyId1, warrantyId2, warrantyId3, plan } = req.body;

		// console.log(req.body, warrantyId1);
    
		const email = (req.user !== undefined ? req.user?.email : '');
		// const email = "a@gmail.com";

		const opt1 = selectFunction(
			"SELECT ec_products.id, ec_options.name AS warranty, GROUP_CONCAT(ec_option_value.option_value) AS options, GROUP_CONCAT(ec_option_value.affect_price) as affect_price, GROUP_CONCAT(ec_option_value.id) as optionId FROM ec_products LEFT JOIN ec_options ON ec_options.product_id = ec_products.id LEFT JOIN ec_option_value ON ec_options.id = ec_option_value.option_id WHERE ec_products.id = '"
				.concat(`${productId}`)
		    .concat("' limit 10 offset 0")
		);

		request(opt1, async (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);
        
				if (x.length >= 1) {
          if (warrantyId1 !== undefined) {
            const wId1 = x[0].optionId.split(',');
            const wId2 = x[0].options.split(',');
            const wId3 = x[0].affect_price.split(',');

            // console.log(wId1, wId2, wId3);

            if (wId1.includes(warrantyId1) && wId2.includes(warrantyId2) && wId3.includes(warrantyId3)) {
              let values1 = `\'${email}\', '${productId}\', '${warrantyId1}\', '${quantity}\'`;

              const opt2 = insertFunction(
                "insert into hCart (email, product_id, option_id, quantity) values(" 
                .concat(`${values1}`)
                .concat(")"),
                "select * from hCart where email = '"
                .concat(`${email}`)
                .concat("' limit 10 offset 0")
              );

              request(opt2, (error, response) => {
                if (error) throw new Error(error);
                else {
                  let y = JSON.parse(response.body);

                  // console.log(y);

                  if (y.length >= 1) {
                    return res.redirect("/v1/cart");
                  }

                  else {
                    return res.redirect("/v1/cart");
                  }
                }
              })
            }

            else {
              return res.redirect("/v1/cart");
            }
          }
          else {
            let values2 = `\'${email}\', '${productId}\', \'000\', '${quantity}\'`;

            const opt3 = insertFunction(
              "insert into hCart (email, product_id, option_id, quantity) values(" 
                .concat(`${values2}`)
                .concat(")"),
              "select * from hCart where email = '"
                .concat(`${email}`)
                .concat("' limit 10 offset 0")
            );
            request(opt3, (error, response) => {
              if (error) throw new Error(error);
              else {
                  let y = JSON.parse(response.body);

                  // console.log(y);

                  if (y.length >= 1) {
                    return res.redirect("/v1/cart");
                  }

                  else {
                    return res.redirect("/v1/cart");
                  }
                }
            })
          }
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}

	catch(error) {
		return res.redirect("/v1/cart");
	}
})

router.get("/v1/cart", async (req, res, next) => {
	const email = (req.user !== undefined ? req.user?.email : '');
	// const email = "a@gmail.com";

	const isLoggedIn = req.session.isLoggedIn === 'true' || req.session.isLoggedIn === true;

	const isAuthenticated = (email !== '' && isLoggedIn);

	// console.log(isAuthenticated);

	const page = parseInt(req.query.page) || 1;
	const itemsPerPage = 10;

	let message = req.flash('error');
	// console.log(message);

	if (message.length > 0) {
		message = message[0];
	}
	else {
		message = null;
	}

	if (email) {
		const opt1 = selectFunction(
			"select COUNT(*) as cLength from hCart where email = '"
			.concat(`${email}`)
			.concat("'")
		);

		request(opt1, async (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x[0].cLength >= 1) {          
          const opt2 = selectFunction(
            "SELECT SUM( CASE WHEN hCart.option_id = '0' THEN hCart.quantity * ec_products.price ELSE hCart.quantity * COALESCE(ec_option_value.affect_price, ec_products.price, 0) END ) as tp FROM `hCart` INNER JOIN ec_products ON hCart.product_id = ec_products.id LEFT JOIN ec_option_value ON hCart.option_id = ec_option_value.id WHERE email = '"
              .concat(`${email}`)
              .concat("'")
          );

					request(opt2, async (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = JSON.parse(response.body);

							// console.log(y);
                            
              const opt3 = selectFunction(
                "SELECT hCart.id as cartID, hCart.quantity, CASE WHEN hCart.option_id = '0' THEN ec_products.price ELSE ec_option_value.affect_price END as price, ec_products.name, ec_products.image, ec_products.id FROM hCart INNER JOIN ec_products ON hCart.product_id = ec_products.id LEFT JOIN ec_option_value ON hCart.option_id = ec_option_value.id WHERE email = '"
                  .concat(`${email}`)
                  .concat("'")
              );

							request(opt3, async (error, response) => {
								if (error) throw new Error(error);
								else {
									let z = JSON.parse(response.body);

									// console.log(z);
                  
									if (z.length >= 1) {
										const totalCount = x[0].cLength;
							      const pageCount = Math.ceil(totalCount / itemsPerPage);

							      // Calculate start and end indices for pagination
							      const startIndex = (page - 1) * itemsPerPage;
							      const endIndex = startIndex + itemsPerPage;

							      // Slice the results array based on pagination
							      const paginatedResults = z.slice(startIndex, endIndex);

										return res.render("user/cart", {
											title: 'Cart',
											lang: req.lang,
											errorMessage: message,
											products: paginatedResults,
											isAuth: isAuthenticated,
											cart: x[0].cLength,
											currentPage: page,
				              pageCount: pageCount
										})
									}

									else {
										return res.render("user/cart", {
											title: 'Cart',
											lang: req.lang,
											errorMessage: message,
											products: [],
											isAuth: isAuthenticated,
											cart: x[0].cLength,
											currentPage: page,
				              pageCount: 0
										})
									}
								}
							})
						}
					})
				} 

				else {
					return res.render("user/cart", {
						title: 'Cart',
						lang: req.lang,
						errorMessage: message,
						products: [],
						isAuth: isAuthenticated,
						cart: x[0].cLength,
            currentPage: page,
				    pageCount: 0
					})
				}
			}
		})
	}

	else {
		return res.render("user/cart", {
			title: 'Cart',
			lang: req.lang,
			errorMessage: message,
			products: [],
			isAuth: false,
			cart: '0',
      currentPage: page,
			pageCount: 0
		})
	}
})

// isAuth
router.post("/v1/updateCart", isAuth, async (req, res, next) => {
	try {
		const { quantity, productId, cartID } = req.body;

		// console.log(req.body);

		const email = (req.user !== undefined ? req.user?.email : '');
		// const email = "a@gmail.com";

		let opt1 = selectFunction(
			"select * from ec_products where id = '"
			.concat(`${productId}`)
			.concat("' limit 10 offset 0")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					let opt2 = updateFunction(
						"update hCart SET quantity = '"
							.concat(`${quantity}`)
							.concat("' where id = '")
							.concat(`${cartID}`)
							.concat("' AND email = '")
							.concat(`${email}`)
							.concat("'"),
						"select * from hCart where email = '"
							.concat(`${email}`)
							.concat("' limit 10 offset 0")
					);

					request(opt2, (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = JSON.parse(response.body);

							// console.log(y);

							if (y.length >= 1) {
								return res.redirect("/v1/cart");
							}

							else {
								return res.redirect("/v1/cart");
							}
						}
					})
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}
	catch(error) {
		return res.redirect("/v1/cart");
	}
})

// isAuth
router.post("/v1/deleteCart", isAuth, async (req, res, next) => {
	try {
		const { productId } = req.body;

		// console.log(req.body);

		const email = (req.user !== undefined ? req.user?.email : '');
		// const email = "a@gmail.com";

		let opt1 = deleteFunction(
			"delete from hCart where id = '"
			.concat(`${productId}`)
			.concat("' AND email = '")
			.concat(`${email}`)
			.concat("'"),
			"select * from hCart where email = '"
			.concat(`${email}`)
			.concat("' limit 10 offset 0")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					return res.redirect("/v1/cart");
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}
	catch(error) {
		return res.redirect("/v1/cart");
	}
})

router.post("/v1/buyNow", isAuth, async (req, res, next) => {
	try {
    const { quantity, productId, warrantyId1, warrantyId2, warrantyId3, plan, pName } = req.body;

		// console.log(req.body);
    
		const email = (req.user !== undefined ? req.user?.email : '');
		// const email = "a@gmail.com";
    
    const opt1 = selectFunction(
			"SELECT ec_products.id, ec_options.name AS warranty, GROUP_CONCAT(ec_option_value.option_value) AS options, GROUP_CONCAT(ec_option_value.affect_price) as affect_price, GROUP_CONCAT(ec_option_value.id) as optionId FROM ec_products LEFT JOIN ec_options ON ec_options.product_id = ec_products.id LEFT JOIN ec_option_value ON ec_options.id = ec_option_value.option_id WHERE ec_products.id = '"
				.concat(`${productId}`)
		    .concat("' limit 10 offset 0")
		);
    
    request(opt1, async (error, response) => {
      if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);
        
        if (x.length >= 1) {
          if (warrantyId1 !== undefined) {
            const wId1 = x[0].optionId.split(',');
            const wId2 = x[0].options.split(',');
            const wId3 = x[0].affect_price.split(',');

            // console.log(wId1, wId2, wId3);

            if (wId1.includes(warrantyId1) && wId2.includes(warrantyId2) && wId3.includes(warrantyId3)) {
              return res.redirect(`/v1/payments?quantity=${quantity}&productId=${productId}&warrantyId1=${warrantyId1}&warrantyId2=${warrantyId2}&warrantyId3=${warrantyId3}&plan=${plan}&pName=${pName}&fromBuyNow=true`);
            }
            else {
              return res.redirect(`/v1/payments?quantity=${quantity}&productId=${productId}&warrantyId1=&warrantyId2=&warrantyId3=&plan=&pName=${pName}&fromBuyNow=true`);
            }
          }
          else {
            return res.redirect(`/v1/payments?quantity=${quantity}&productId=${productId}&warrantyId1=&warrantyId2=&warrantyId3=&plan=&pName=${pName}&fromBuyNow=true`);
          }
        }
        else {
          return res.redirect(`/v1/details/${pName}`);
        }
      }
    })
	}

	catch(error) {
		return res.redirect("/");
	}
})

// isAuth
router.get("/v1/payments", isAuth, async (req, res, next) => {
	try {
		const email = (req.user !== undefined ? req.user?.email : '');
		// const email = "a@gmail.com";

		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}
    
    const isRedirectedFromBuyNow = req.query.fromBuyNow || '';
    // console.log(isRedirectedFromBuyNow, req.query);
        
    if (isRedirectedFromBuyNow == '') {
      const opt1 = selectFunction(
        "SELECT SUM( CASE WHEN hCart.option_id = '0' THEN hCart.quantity * ec_products.price ELSE hCart.quantity * COALESCE(ec_option_value.affect_price, ec_products.price, 0) END ) as tp FROM `hCart` INNER JOIN ec_products ON hCart.product_id = ec_products.id LEFT JOIN ec_option_value ON hCart.option_id = ec_option_value.id WHERE email = '"
          .concat(`${email}`)
          .concat("'")
      );

      request(opt1, (error, response) => {
        if (error) throw new Error(error);
        else {
          let x = JSON.parse(response.body);

          // console.log(x);

          if (x.length >= 1) {
            const opt2 = {
              'method': 'GET',
              'url': 'https://api.nowpayments.io/v1/full-currencies',
              'headers': {
                'x-api-key': 'VCBBF24-S72MFP5-PR227H3-4HACZWP'
              }
            };
            request(opt2, function (error, response) {
              if (error) throw new Error(error);
              // console.log(response.body);

              let y = JSON.parse(response.body);
              // console.log(y);

              if (y.currencies.length >= 1) {
                const getCurrency = y.currencies.filter(i => {
                  if(i.code.toUpperCase() == 'BTC' || i.code.toUpperCase() == 'ETH' 
                    || i.code.toUpperCase() == 'LTC' || i.code.toUpperCase() == 'TRX' 
                    || i.code.toUpperCase() == 'USDTERC20' || i.code.toUpperCase() == 'USDTTRC20') {
                      return true;
                  }
                }).map(j => { return { code: j.code, name: j.name, imgUrl: j.logo_url } });

                // console.log(getCurrency);

                return res.render("user/payment", {
                  title: "Payments",
                  lang: req.lang,
                  total: Number(x[0].tp).toFixed(4),
                  currency: getCurrency,
                  email: email,
                  errorMessage: message,
                  isRedirectedFromBuyNow: false,
                  quantity: '',
                  productId: '',
                  warrantyId1: '',
                  warrantyId2: '',
                  warrantyId3: '',
                  plan: '',
                  pName: ''
                })
              }

              else {
                req.flash('error', 'Try Again...');
                return res.redirect("/v1/cart");
              }
            });
          }

          else {
            req.flash('error', 'Try Again...');
            return res.redirect("/v1/cart");
          }
        }
      })
    }
    
    else {
      const quantity = req.query.quantity;
      const productId = req.query.productId;
      const warrantyId1 = req.query.warrantyId1;
      const warrantyId2 = req.query.warrantyId2;
      const warrantyId3 = req.query.warrantyId3;
      const plan = req.query.plan;
      const pName = req.query.pName;
      
      if (quantity !== undefined && productId !== undefined && warrantyId1 !== undefined && warrantyId2 !== undefined && warrantyId3 !== undefined && plan !== undefined && pName !== undefined) {
        const opt3 = {
          'method': 'GET',
          'url': 'https://api.nowpayments.io/v1/full-currencies',
          'headers': {
            'x-api-key': 'VCBBF24-S72MFP5-PR227H3-4HACZWP'
          }
        };
        
        request(opt3, function (error, response) {
          if (error) throw new Error(error);
          // console.log(response.body);

          let y = JSON.parse(response.body);
          // console.log(y);

          if (y.currencies.length >= 1) {
            const getCurrency = y.currencies.filter(i => {
              if(i.code.toUpperCase() == 'BTC' || i.code.toUpperCase() == 'ETH' 
                  || i.code.toUpperCase() == 'LTC' || i.code.toUpperCase() == 'TRX' 
                  || i.code.toUpperCase() == 'USDTERC20' || i.code.toUpperCase() == 'USDTTRC20') {
                return true;
              }
            }).map(j => { return { code: j.code, name: j.name, imgUrl: j.logo_url } });

            // console.log(getCurrency);

            return res.render("user/payment", {
              title: "Payments",
              lang: req.lang,
              total: '',
              currency: getCurrency,
              email: email,
              errorMessage: message,
              isRedirectedFromBuyNow: true,
              quantity: quantity,
              productId: productId,
              warrantyId1: warrantyId1,
              warrantyId2: warrantyId2,
              warrantyId3: warrantyId3,
              plan: plan,
              pName: pName
            })
          }

          else {
            req.flash('error', 'Try Again...');
            return res.redirect("/v1/cart");
          }
        });
      }
      
      else {
        return res.redirect(`/v1/details/${pName}`);
      }      
    }
	}
	catch(error) {
		return res.redirect("/v1/cart");
	}
})

// isAuth
router.post("/v1/pay", isAuth, async (req, res, next) => {
	try {
		const crypto = req.body.crypto[0];

		// console.log(req.body.crypto[0]);

		const email = (req.user !== undefined ? req.user?.email : '');
		// const email = 'aabb@gmail.com';
    
    const { isRedirectedFromBuyNow, quantity, productId, warrantyId1, warrantyId2, warrantyId3, pName } = req.body;
    console.log(req.body, isRedirectedFromBuyNow == 'false');
        
    if (isRedirectedFromBuyNow == 'false') {
    	console.log("1");
      const opt1 = selectFunction(
        "SELECT SUM( CASE WHEN hCart.option_id = '0' THEN hCart.quantity * ec_products.price ELSE hCart.quantity * COALESCE(ec_option_value.affect_price, ec_products.price, 0) END ) as tp FROM `hCart` INNER JOIN ec_products ON hCart.product_id = ec_products.id LEFT JOIN ec_option_value ON hCart.option_id = ec_option_value.id WHERE email = '"
          .concat(`${email}`)
          .concat("' limit 10 offset 0")
      );

      request(opt1, (error, response) => {
        if (error) throw new Error(error);
        else {
          let x = JSON.parse(response.body);

          // console.log(x);

          if(x.length >= 1) {
            const total = parseFloat(x[0].tp).toFixed(2);

            const uid = req.user.id;

            // console.log(uid, crypto, total, req.user.email);

            const opt2 = selectFunction(
              "SELECT hCart.id as cartID, hCart.quantity as qty, hCart.option_id, CASE WHEN hCart.option_id = '0' THEN ec_products.price ELSE ec_option_value.affect_price END as price, ec_products.name, ec_products.image, ec_products.id FROM hCart INNER JOIN ec_products ON hCart.product_id = ec_products.id LEFT JOIN ec_option_value ON hCart.option_id = ec_option_value.id WHERE email = '"
                .concat(`${email}`)
                .concat("'")
            );

            request(opt2, async (error, response) => {
              if (error) throw new Error(error);
              else {
                let y = await JSON.parse(response.body);

                // console.log(y);

                const myJSON = JSON.stringify(
                  {
                    "uid": uid,
                    "email": req.user.email,
                    "products": y,
                    "total": total,
                    "crypto": crypto
                  }
                );

                // console.log(myJSON);
                
                const opt3 = {
                  'method': 'POST',
                  'url': 'https://api.h4kig.cc/web_api/getPayAddress.php',
                  'headers': {
                    'Content-Type': 'application/json'
                  },
                  body: myJSON
                };

                request(opt3, function (error, response) {
                  if (error) throw new Error(error);
                  else {
                    // console.log(response.body);
                    let z = JSON.parse(response.body);

                    // console.log(z);

                    if (z !== '') {
                    	return res.redirect("/v1/qr/?isRedirectedFromBuyNow=false");
                    }
                    else {
                      req.flash('error', 'Try Again...');
                      return res.redirect("/v1/cart");
                    }
                  }
                });
              }
            })
          }

          else {
            return res.redirect("/v1/cart");
          }
        }
      })
    }
    
    else {
      if (warrantyId1 !== '') {
    		console.log("2");
        const opt4 = selectFunction(
          "SELECT ec_products.id, ec_products.name, ec_products.image, ec_options.name AS warranty, GROUP_CONCAT(ec_option_value.option_value) AS options, GROUP_CONCAT(ec_option_value.affect_price) as affect_price, GROUP_CONCAT(ec_option_value.id) as optionId FROM ec_products LEFT JOIN ec_options ON ec_options.product_id = ec_products.id LEFT JOIN ec_option_value ON ec_options.id = ec_option_value.option_id WHERE ec_products.id = '"
            .concat(`${productId}`)
            .concat("' AND ec_option_value.id = '")
            .concat(`${warrantyId1}`)
            .concat("'")
        );

        request(opt4, async (error, response) => {
          if (error) throw new Error(error);
          else {
            let y = await JSON.parse(response.body);

            // console.log(y);

            if (y.length >= 1) {
              const total = Number(y[0].affect_price) * Number(quantity);
              const uid = req.user.id;
              const products = [{
                id: y[0].id,
                qty: quantity,
                price: y[0].affect_price,
                name: y[0].name,
                image: y[0].image
              }];
              
              const myJSON = JSON.stringify(
                  {
                    "uid": uid,
                    "email": req.user.email,
                    "products": products,
                    "total": total,
                    "crypto": crypto
                  }
              );
              
              // console.log(myJSON);
              
              const opt7 = {
                  'method': 'POST',
                  'url': 'https://api.h4kig.cc/web_api/getPayAddress.php',
                  'headers': {
                    'Content-Type': 'application/json'
                  },
                  body: myJSON
              };

              request(opt7, function (error, response) {
                if (error) throw new Error(error);
                else {
                 // console.log(response.body);
                 let z = JSON.parse(response.body);

                 // console.log(z);

                  if (z !== '') {
                    	return res.redirect("/v1/qr/?isRedirectedFromBuyNow=true");
                    }
                  else {
                   req.flash('error', 'Try Again...');
                      return res.redirect("/v1/cart");
                 }
                }
              });
            }

            else {
              return res.redirect(`/v1/details/${pName}`);
            }
          }
        })
      }
      else {
        const opt5 = selectFunction(
          "SELECT ec_products.id, ec_products.name, ec_products.image, ec_products.price from ec_products WHERE ec_products.id = '"
            .concat(`${productId}`)
            .concat("'")
        );
        
        request(opt5, async (error, response) => {
          if (error) throw new Error(error);
          else {
            let y = await JSON.parse(response.body);

            console.log(y);

            if (y.length >= 1) {
              const total = Number(y[0].price) * Number(quantity);
              const uid = req.user.id;
              const products = [{
                id: y[0].id,
                qty: quantity,
                price: y[0].price,
                name: y[0].name,
                image: y[0].image
              }];
              
              const myJSON = JSON.stringify(
                  {
                    "uid": uid,
                    "email": req.user.email,
                    "products": products,
                    "total": total,
                    "crypto": crypto
                  }
              );

              console.log(myJSON);
              
              const opt6 = {
                  'method': 'POST',
                  'url': 'https://api.h4kig.cc/web_api/getPayAddress.php',
                  'headers': {
                    'Content-Type': 'application/json'
                  },
                  body: myJSON
                };

              request(opt6, function (error, response) {
                if (error) throw new Error(error);
                else {
                 console.log(response.body);
                 // let z = JSON.parse(response.body);

                 // console.log(z);

                 //  if (z !== '') {
                 //    return res.redirect("/v1/qr/?isRedirectedFromBuyNow=true");
                 //  }
                  
                 //  else {
                 //     req.flash('error', 'Try Again...');
                 //     return res.redirect("/v1/cart");
                 // 	}
                }
              });
            }

            else {
              // return res.redirect(`/v1/details/${pName}`);
              return res.redirect(`/`);
            }
          }
        })
      }
    }
	}

	catch(error) {
		console.log(error);
		return res.redirect("/v1/cart");
	}
})

router.get("/v1/qr", isAuth, async (req, res, next) => {
	try {
		const lang = req.lang.smws.lang;

		const uid = req.user?.id;

		const opt1 = selectFunction(`SELECT charge_id FROM payments WHERE customer_id = ${uid} ORDER BY id DESC LIMIT 1`);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length === 1) {
					const opt2 = {
					  'method': 'GET',
					  'url': `https://api.nowpayments.io/v1/payment/${x[0].charge_id}`,
					  'headers': {
					    'x-api-key': 'VCBBF24-S72MFP5-PR227H3-4HACZWP'
					  }
					};

					request(opt2, (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = JSON.parse(response.body);
							// console.log(y);

							if (y !== '') {
								const address = y.pay_address;

                QRCode.toDataURL(address, function (err, url) {
                  if (err) {
                    // Handle any errors that may occur when generating the QR code
                    console.log(err);
                    return res.redirect("/v1/cart");
                  } 
                  else {
                    // console.log(url);

                    return res.render('user/cryptoQR', {
                      title: "PAYNOW",
                      lang: req.lang,
                      address: address,
                      amount: y.pay_amount,
                      currency: y.pay_currency,
                      cAmt: y.price_amount,
                      iSrc: url,
                      isRedirectedFromBuyNow: req.query.isRedirectedFromBuyNow
                    });
                  }
                })
							}
						}
					})
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}

	catch(error) {
		console.log(error);
		return res.redirect("/v1/qr");
	}
})

// isAuth
router.get("/v1/getOrders/:type", isAuth, async (req, res, next) => {
	try {
		const uid = req.user?.id;
		const email = req.user?.email;

		const page = parseInt(req.query.page) || 1;
		const itemsPerPage = 10;

		let offset = 0;

		if (page == 1) {
			offset = 0;
		}
		else {
			offset = 10 * (page - 1);
		}
    
    const { type } = req.params;
    
    // console.log(type);
    
    if (type == 'false') {
      let opt1 = deleteFunction(
        "delete from hCart where email = '"
          .concat(`${email}`)
          .concat("'"),
        "select * from hCart where email = '"
          .concat(`${email}`)
          .concat("'")
      );

      request(opt1, async (error, response) => {
        if (error) throw new Error(error);
        else {
          let y = await JSON.parse(response.body);
        }
      })
    }
  
    let opt2 = selectFunction(
      `select ec_orders.id as id, ec_order_product.qty, ec_order_product.price, ec_order_product.product_name, ec_order_product.product_image, ec_orders.status from ec_orders left join ec_order_product on ec_order_product.order_id = ec_orders.id where user_id = ${uid} order by ec_orders.id desc limit 10 offset ${offset}`
    );
    
          request(opt2, async (error, response) => {
            if (error) throw new Error(error);
            else {
              let x = await JSON.parse(response.body);

              // console.log(x);

              if (x.length >= 1) {
                let opt3 = selectFunction(
                  `SELECT COUNT(*) AS totalDataCount FROM (SELECT ec_orders.id as id, ec_order_product.qty, ec_order_product.price, ec_order_product.product_name, ec_order_product.product_image, ec_orders.status FROM ec_orders LEFT JOIN ec_order_product ON ec_order_product.order_id = ec_orders.id WHERE user_id = ${uid}) AS subquery`
                );

                request(opt3, async (error, response) => {
                  if (error) throw new Error(error);
                  else {
                    let z = await JSON.parse(response.body);
                    // console.log(z);

                    if (z.length >= 1) {
                      const opt4 = selectFunction(
                        "select COUNT(*) as cLength from hCart where email = '"
                        .concat(`${email}`)
                        .concat("'")
                      );
                      
                      request(opt4, async (error, response) => {
                        if (error) throw new Error(error);
                        else {
                          let z1 = await JSON.parse(response.body);
                          // console.log(z1);
                          
                          const totalCount = z[0].totalDataCount;
                          const pageCount = Math.ceil(totalCount / itemsPerPage);
                          
                          if (z1.length >= 1) {
                            return res.render("user/orders", 
                              {
                                title: "Orders",
                                lang: req.lang,
                                isAuth: true,
                                cart: z1[0].cLength,
                                products: x,
                                currentPage: page,
                                pageCount: pageCount
                              }
                            )
                          }
                          
                          else {
                            return res.render("user/orders", 
                              {
                                title: "Orders",
                                lang: req.lang,
                                isAuth: true,
                                cart: 0,
                                products: x,
                                currentPage: page,
                                pageCount: pageCount
                              }
                            )
                          }
                        }
                      })
                    }

                    else {
                      return res.render("user/orders", 
                        {
                          title: "Orders",
                          lang: req.lang,
                          isAuth: true,
                          cart: 0,
                          products: x,
                          currentPage: page,
                          pageCount: 0
                        }
                      )
                    }
                  }
                })
              }
              else {
                return res.render("user/orders", 
                  {
                    title: "Orders",
                    lang: req.lang,
                    isAuth: true,
                    cart: 0,
                    products: [],
                    currentPage: page,
                    pageCount: 0
                  }
                )
              }
            }
          })
	}
	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/v1/faq", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		const lang = req.lang.smws.lang;

		// console.log(lang);

		let opt1 = '';

		if (lang == 'en') {
			opt1 = selectFunction("select * from faqs_translations");
		}

		else {
			opt1 = selectFunction("select * from faqs");
		}

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x, req.lang.smws.lang);

				return res.render('user/faq', 
					{ 
						title: 'FAQ',
						lang: req.lang,
				    errorMessage: message,
						isAuth: false,
						cart: '0',
						data: x
					}
				);
			}
		});
	}
	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/v1/contactUs", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		return res.render('user/contact', 
			{ 
				title: 'Contact',
				lang: req.lang,
				errorMessage: message,
				isAuth: false,
				cart: '0',
        oldInput: {
			    email: '',
			    telegram: '',
			    message: ''
			  }
			}
		);
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.post("/v1/newsLetter",
	[
		body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
	],
 	async (req, res, next) => {
		const referer = req.headers.referer;
		try {
			const { email } = req.body;

			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array()[0].msg);
				req.flash('error', error.array()[0].msg);
				return res.redirect(referer);
			}

			else {
				const values1 = `\'${email}\', null, \'subscribed\', null, null`;

				// console.log(values1);

				let opt1 = insertFunction(
					"INSERT INTO newsletters (email, name, status, created_at, updated_at) VALUES ("
						.concat(`${values1}`)
						.concat(")"),
					"select * from newsletters where email = '"
						.concat(`${email}`)
						.concat("' limit 10 offset 0")
				);

				request(opt1, async (error, response) => {
					if (error) throw new Error(error);
					else {
						const x = JSON.parse(response.body);

						// console.log(x);

						if (x.length >= 1) {
							return res.redirect(referer);
						}
						else {
				      req.flash('error', "Failed try again...");
							return res.redirect(referer);
						}
					}
				})
			}
		}
		catch(error) {
			console.log(error);
			return res.redirect(referer);
		}
})

router.post("/v1/contactUs",
	[
		body('telegram')
      .trim()
      .notEmpty()
      .withMessage('Name Required')
      .matches(/^[^$%&*^/<>]+$/)
      .withMessage('Only Characters with white space and numbers are allowed'),
    body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Description required'),
	],
  async (req, res, next) => {
	try {
		// console.log(req.body);

		const { telegram, email, message } = req.body;

		const error = validationResult(req);

		if (!error.isEmpty()) {
				// console.log(error.array());
				let msg1 = error.array()[0].msg;

				if (msg1 == 'Name Required' && req.session.lang == 'fr') {
					msg1 = "Nom (obligatoire";
				}
				else if (msg1 == 'Only Characters with white space and numbers are allowed' && req.session.lang == 'fr') {
					msg1 = "Seuls les caractères avec des espaces blancs et des chiffres sont autorisés";
				}
				else if (msg1 == 'Email Address required' && req.session.lang == 'fr') {
					msg1 = "Adresse mail: (requis";
				}
				else if (msg1 == 'Invalid email' && req.session.lang == 'fr') {
					msg1 = "Email invalide";
				}
				else if (msg1 == 'Description required' && req.session.lang == 'fr') {
					msg1 = "Description requise";
				}
				else {
					msg1 = error.array()[0].msg;
				}

				return res.render('user/contact', 
					{ 
						title: 'Contact',
						lang: req.lang,
						errorMessage: msg1,
						isAuth: false,
						cart: '0',
						oldInput: {
			      	email: email,
			      	telegram: telegram,
			      	message: message
			      }
					}
				);
		}

		else {
			let opt1 = selectFunction(
				"SELECT `AUTO_INCREMENT` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'bhav_h4kig_db' AND TABLE_NAME = 'contacts'"
			);

			request(opt1, async (error, response) => {
				if (error) throw new Error(error);
				else {
					let x = await JSON.parse(response.body);

					// console.log(x);

					if (x.length >= 1) {
						const AUTO_INCREMENT = x[0].AUTO_INCREMENT;

						const currentDate = new Date();

						const subDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

						// console.log(subDate);

						const values1 = `\'${telegram}\', \'${email}\', \'${message}\', \'${subDate}\', \'${subDate}\'`;

						const opt2 = insertFunction(
							"INSERT INTO contacts(name, email, content, created_at, updated_at) VALUES ("
								.concat(`${values1}`)
								.concat(")"),
							"SELECT * FROM contacts where id = '"
								.concat(`${AUTO_INCREMENT}`)
								.concat("' limit 10 offset 0")
						);

						request(opt2, async (error, response) => {
							if (error) throw new Error(error);
							else {
								let y = await JSON.parse(response.body);

								// console.log(y);
								if (y.length >= 1) {
									return res.redirect("/");
								}
								else {
									req.flash('error', 'Try Again...');
									return res.redirect("/v1/contactUs");
								}
							}
						})
					}
				}
			})
		}
	}
	catch(error) {
		console.log(error);
		return res.redirect("/")
	}
})

module.exports = router;