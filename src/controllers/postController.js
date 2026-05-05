const pool = require("../db");
const { saveImageVersions, deleteImageIfExists } = require("../utils/imageService");

const createPost = async (req, res) => {
  const client = await pool.connect();
  const savedImages = [];

  try {
    const { title, description, created_at } = req.body;
    const files = req.files;

    if (!req.session || !req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Yetkisiz işlem.",
      });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Başlık zorunludur.",
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "En az 1 fotoğraf yüklemelisin.",
      });
    }

    for (const file of files) {
      savedImages.push(await saveImageVersions(file));
    }

    await client.query("BEGIN");

    const postResult = await client.query(
      `
      INSERT INTO cf_posts (title, description, created_at)
      VALUES ($1, $2, COALESCE($3::timestamp, CURRENT_TIMESTAMP))
      RETURNING id, title, description, created_at
      `,
      [
        title.trim(),
        description ? description.trim() : null,
        created_at && created_at.trim() !== "" ? created_at : null,
      ]
    );

    const post = postResult.rows[0];

    for (let i = 0; i < savedImages.length; i++) {
      const image = savedImages[i];
      const isCover = i === 0;

      await client.query(
        `
        INSERT INTO cf_post_images (post_id, image_url, thumb_url, image_order, is_cover)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [post.id, image.imageUrl, image.thumbUrl, i, isCover]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Paylaşım başarıyla oluşturuldu.",
      data: post,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    for (const image of savedImages) {
      deleteImageIfExists(image.imageUrl);
      deleteImageIfExists(image.thumbUrl);
    }

    console.error("createPost hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  } finally {
    client.release();
  }
};

const getPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.created_at,
        pi.image_url AS cover_image,
        pi.thumb_url AS cover_thumb
      FROM cf_posts p
      LEFT JOIN cf_post_images pi 
        ON p.id = pi.post_id AND pi.is_cover = true
      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("getPosts hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const getAdminPosts = async (req, res) => {
  try {
    if (!req.session || !req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Yetkisiz işlem.",
      });
    }

    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.created_at,
        pi.image_url AS cover_image,
        pi.thumb_url AS cover_thumb
      FROM cf_posts p
      LEFT JOIN cf_post_images pi 
        ON p.id = pi.post_id AND pi.is_cover = true
      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("getAdminPosts hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const postResult = await pool.query(
      `
      SELECT id, title, description, created_at
      FROM cf_posts
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paylaşım bulunamadı.",
      });
    }

    const imagesResult = await pool.query(
      `
      SELECT id, image_url, thumb_url, image_order, is_cover
      FROM cf_post_images
      WHERE post_id = $1
      ORDER BY image_order ASC
      `,
      [id]
    );

    const post = postResult.rows[0];
    post.images = imagesResult.rows;

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("getPostById hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  }
};

const updatePost = async (req, res) => {
  const client = await pool.connect();
  const savedImages = [];

  try {
    if (!req.session || !req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Yetkisiz işlem.",
      });
    }

    const { id } = req.params;
    const { title, description, created_at } = req.body;
    const files = req.files || [];

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Başlık zorunludur.",
      });
    }

    const postCheck = await client.query(
      `SELECT id FROM cf_posts WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paylaşım bulunamadı.",
      });
    }

    for (const file of files) {
      savedImages.push(await saveImageVersions(file));
    }

    await client.query("BEGIN");

    await client.query(
      `
      UPDATE cf_posts
      SET 
        title = $1,
        description = $2,
        created_at = COALESCE($3::timestamp, created_at)
      WHERE id = $4
      `,
      [
        title.trim(),
        description ? description.trim() : null,
        created_at && created_at.trim() !== "" ? created_at : null,
        id,
      ]
    );

    if (savedImages.length > 0) {
      const orderResult = await client.query(
        `
        SELECT COALESCE(MAX(image_order), -1) AS max_order
        FROM cf_post_images
        WHERE post_id = $1
        `,
        [id]
      );

      let startOrder = Number(orderResult.rows[0].max_order) + 1;

      const coverResult = await client.query(
        `
        SELECT id FROM cf_post_images
        WHERE post_id = $1 AND is_cover = true
        LIMIT 1
        `,
        [id]
      );

      const hasCover = coverResult.rows.length > 0;

      for (let i = 0; i < savedImages.length; i++) {
        const image = savedImages[i];
        const isCover = !hasCover && i === 0;

        await client.query(
          `
          INSERT INTO cf_post_images (post_id, image_url, thumb_url, image_order, is_cover)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [id, image.imageUrl, image.thumbUrl, startOrder + i, isCover]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Paylaşım güncellendi.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    for (const image of savedImages) {
      deleteImageIfExists(image.imageUrl);
      deleteImageIfExists(image.thumbUrl);
    }

    console.error("updatePost hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  } finally {
    client.release();
  }
};

const deletePostImage = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.session || !req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Yetkisiz işlem.",
      });
    }

    const { imageId } = req.params;

    const imageResult = await client.query(
      `
      SELECT id, post_id, image_url, thumb_url, is_cover
      FROM cf_post_images
      WHERE id = $1
      LIMIT 1
      `,
      [imageId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Fotoğraf bulunamadı.",
      });
    }

    const image = imageResult.rows[0];

    const countResult = await client.query(
      `
      SELECT COUNT(*)::int AS total
      FROM cf_post_images
      WHERE post_id = $1
      `,
      [image.post_id]
    );

    if (countResult.rows[0].total <= 1) {
      return res.status(400).json({
        success: false,
        message: "Bir paylaşımın son fotoğrafı silinemez.",
      });
    }

    await client.query("BEGIN");

    await client.query(`DELETE FROM cf_post_images WHERE id = $1`, [imageId]);

    if (image.is_cover) {
      const nextImageResult = await client.query(
        `
        SELECT id
        FROM cf_post_images
        WHERE post_id = $1
        ORDER BY image_order ASC
        LIMIT 1
        `,
        [image.post_id]
      );

      if (nextImageResult.rows.length > 0) {
        await client.query(
          `
          UPDATE cf_post_images
          SET is_cover = true
          WHERE id = $1
          `,
          [nextImageResult.rows[0].id]
        );
      }
    }

    await client.query("COMMIT");

    deleteImageIfExists(image.image_url);
    deleteImageIfExists(image.thumb_url);

    return res.status(200).json({
      success: true,
      message: "Fotoğraf silindi.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("deletePostImage hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  } finally {
    client.release();
  }
};

const setCoverImage = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.session || !req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Yetkisiz işlem.",
      });
    }

    const { imageId } = req.params;

    const imageResult = await client.query(
      `
      SELECT id, post_id
      FROM cf_post_images
      WHERE id = $1
      LIMIT 1
      `,
      [imageId]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Fotoğraf bulunamadı.",
      });
    }

    const image = imageResult.rows[0];

    await client.query("BEGIN");

    await client.query(
      `
      UPDATE cf_post_images
      SET is_cover = false
      WHERE post_id = $1
      `,
      [image.post_id]
    );

    await client.query(
      `
      UPDATE cf_post_images
      SET is_cover = true
      WHERE id = $1
      `,
      [imageId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Kapak fotoğrafı güncellendi.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("setCoverImage hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  } finally {
    client.release();
  }
};

const deletePost = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.session || !req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Yetkisiz işlem.",
      });
    }

    const { id } = req.params;

    const postCheck = await client.query(
      `SELECT id FROM cf_posts WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paylaşım bulunamadı.",
      });
    }

    const imageResult = await client.query(
      `
      SELECT image_url, thumb_url
      FROM cf_post_images
      WHERE post_id = $1
      `,
      [id]
    );

    await client.query("BEGIN");

    await client.query(`DELETE FROM cf_posts WHERE id = $1`, [id]);

    await client.query("COMMIT");

    for (const row of imageResult.rows) {
      deleteImageIfExists(row.image_url);
      deleteImageIfExists(row.thumb_url);
    }

    return res.status(200).json({
      success: true,
      message: "Paylaşım silindi.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("deletePost hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası.",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createPost,
  getPosts,
  getAdminPosts,
  getPostById,
  updatePost,
  deletePostImage,
  setCoverImage,
  deletePost,
};