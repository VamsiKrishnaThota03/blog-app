export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        user_id: req.user.id
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      author_name: post.user.name
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
}; 